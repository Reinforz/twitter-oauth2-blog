import twitterIcon from "../public/twitter.svg";
import Image from "next/image";

const TWITTER_CLIENT_ID = "T1dLaHdFSWVfTnEtQ2psZThTbnI6MTpjaQ" // give your twitter client id here

// twitter oauth Url constructor
function getTwitterOauthUrl() {
  const rootUrl = "https://twitter.com/i/oauth2/authorize";
  const options = {
    redirect_uri: "http://www.localhost:3001/oauth/twitter", // client url cannot be http://localhost:3000/ or http://127.0.0.1:3000/
    client_id: TWITTER_CLIENT_ID,
    state: "state",
    response_type: "code",
    code_challenge: "y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8",
    code_challenge_method: "S256",
    scope: ["users.read", "tweet.read", "follows.read", "follows.write"].join(" "),
  };
  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

// the component
export function TwitterOauthButton() {
  return (
    <a className="a-button row-container" href={getTwitterOauthUrl()}>
      <Image src={twitterIcon} alt="twitter icon" />
      <p>{" twitter"}</p>
    </a>
  );
}