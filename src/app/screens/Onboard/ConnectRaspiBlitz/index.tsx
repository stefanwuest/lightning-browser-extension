import { useState } from "react";
import { useNavigate } from "react-router-dom";
import utils from "../../../../common/lib/utils";
import Button from "../../../components/Button";
import TextField from "../../../components/form/TextField";
import CompanionDownloadInfo from "../../../components/CompanionDownloadInfo";

const initialFormData = Object.freeze({
  url: "",
  macaroon: "",
});

export default function ConnectRaspiBlitz() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  function handleUrl(event: React.ChangeEvent<HTMLInputElement>) {
    let url = event.target.value.trim();
    if (event.target.value.substring(0, 4) !== "http") {
      url = `https://${url}`;
    }
    setFormData({
      ...formData,
      [event.target.name]: url,
    });
  }

  function handleMacaroon(event: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value.trim(),
    });
  }

  function getConnectorType() {
    if (formData.url.match(/\.onion/i)) {
      return "nativelnd";
    }
    // default to LND
    return "lnd";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const { url, macaroon } = formData;
    const account = {
      name: "RaspiBlitz",
      config: {
        macaroon,
        url,
      },
      connector: getConnectorType(),
    };

    try {
      let validation;
      // TODO: for native connectors we currently skip the validation because it is too slow (booting up Tor etc.)
      if (account.connector === "nativelnd") {
        validation = { valid: true, error: "" };
      } else {
        validation = await utils.call("validateAccount", account);
      }

      if (validation.valid) {
        const addResult = await utils.call("addAccount", account);
        if (addResult.accountId) {
          await utils.call("selectAccount", {
            id: addResult.accountId,
          });
          navigate("/test-connection");
        }
      } else {
        alert(`
          Connection failed. Are your RaspiBlitz credentials correct? \n\n(${validation.error})`);
      }
    } catch (e) {
      console.error(e);
      let message =
        "Connection failed. Are your RaspiBlitz credentials correct?";
      if (e instanceof Error) {
        message += `\n\n${e.message}`;
      }
      alert(message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative mt-14 lg:flex space-x-8 bg-white dark:bg-gray-800 px-12 py-10">
        <div className="lg:w-1/2">
          <h1 className="text-2xl font-bold dark:text-white">
            Connect to your RaspiBlitz node
          </h1>
          <p className="text-gray-500 mt-6 dark:text-gray-400">
            You need your node onion address, port, and a macaroon with read and
            send permissions (e.g. admin.macaroon).
            <br />
            <br />
            <b>SSH</b> into your <b>RaspiBlitz</b>.<br />
            Run the command <b>sudo cat /mnt/hdd/tor/lndrest8080/hostname</b>.
            <br />
            Copy and paste the <b>.onion</b> address in the input below.
            <br />
            Add your <b>port</b> after the onion address, the default port is{" "}
            <b>:8080</b>.
          </p>
          <div className="w-4/5">
            <div className="mt-6">
              <TextField
                id="url"
                label="REST API host"
                placeholder="your-node-onion-address:port"
                onChange={handleUrl}
                required
              />
            </div>
            {formData.url.match(/\.onion/i) && <CompanionDownloadInfo />}
            <div className="mt-6">
              <p className="mb-6 text-gray-500 mt-6 dark:text-gray-400">
                Select <b>CONNECT</b>.<br />
                Select <b>EXPORT</b>.<br />
                Select <b>HEX</b>.<br />
                Copy the <b>adminMacaroon</b>.<br />
                Paste the macaroon in the input below.
              </p>
              <div>
                <TextField
                  id="macaroon"
                  label="Macaroon (HEX format)"
                  value={formData.macaroon}
                  onChange={handleMacaroon}
                  required
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 lg:mt-0 lg:w-1/2">
          <div className="lg:flex h-full justify-center items-center">
            <img src="assets/icons/satsymbol.svg" alt="sat" className="w-64" />
          </div>
        </div>
      </div>
      <div className="my-8 flex space-x-4 justify-center">
        <Button
          label="Back"
          onClick={(e) => {
            e.preventDefault();
            navigate(-1);
            return false;
          }}
        />
        <Button
          type="submit"
          label="Continue"
          primary
          loading={loading}
          disabled={formData.url === "" || formData.macaroon === ""}
        />
      </div>
    </form>
  );
}
