import type { NextPage } from "next";
import { TwitterOauthButton } from "../components/TwitterOauthButton";
import { useMeQuery } from "../hooks/useMeQuery";

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
          <TwitterOauthButton />
        </div>
      )}
    </div>
  );
};

export default Home;
