import type { NextPage } from "next";
import { TwitterOauthButton } from "../components/TwitterOauthButton";
import { useMeQuery } from "../hooks/useMeQuery";

const Home: NextPage = () => {
  const { data: user } = useMeQuery();
  return (
    <div className="column-container">
      <p>Hello!</p>
      {user ? (// user present so only display user's name
        <p>{user.name}</p>
      ) : (// user not present so prompt to login
        <div>
          <p>You are not Logged in! Login with:</p>
          <TwitterOauthButton />
        </div>
      )}
    </div>
  );
};

export default Home;
