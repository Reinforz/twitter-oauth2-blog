import type { NextPage } from "next";
import Image from "next/image";
import { useMeQuery } from "../hooks/useMeQuery";
import twitterIcon from "../public/twitter.svg";

function getTwitterOauthUrl() {
  const rootUrl = "https://twitter.com/i/oauth2/authorize";
  const options = {
    redirect_uri: "https://www.localhost:3001/oauth/twitter", // client url cannot be http://localhost:3000/ or http://127.0.0.1:3000/
    client_id: "T1dLaHdFSWVfTnEtQ2psZThTbnI6MTpjaQ",
    state: "state",
    response_type: "code",
    code_challenge: "challenge",
    code_challenge_method: "plain",
    scope: ["users.read", "tweet.read", "follows.read", "follows.write"].join(" "),
  };
  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

const Home: NextPage = () => {
  const { data: user } = useMeQuery();
  return (
    <div className="column-container">
      <p>Hello!</p>
      {user ? (
        <p>{user.name}</p>
      ) : (
        <div>
          <p>You are not Logged in! Login with:</p>
          <a className="a-button row-container" href={getTwitterOauthUrl()}>
            <Image src={twitterIcon} alt="twitter icon" />
            <p>{" twitter"}</p>
          </a>
        </div>
      )}
    </div>
  );
};

export default Home;
