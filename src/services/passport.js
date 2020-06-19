//const passport = require("passport");
import passport from "passport";
//const FacebookTokenStrategy = require("passport-facebook-token");
//import GoogleTokenStrategy from "passport-google-token";
const { Strategy: GoogleTokenStrategy } = require("passport-google-token");

// GOOGLE STRATEGY
const GoogleTokenStrategyCallback = (
  accessToken,
  refreshToken,
  profile,
  done
) =>
  done(null, {
    accessToken,
    refreshToken,
    profile,
  });

passport.use(
  new GoogleTokenStrategy(
    {
      clientID:
        "862749203167-fv5hmm0vvcnkdjfk1jltu5dvodsd86pi.apps.googleusercontent.com",
      clientSecret: "gdippfZklizNhmea30yoBA4Bs",
    },
    GoogleTokenStrategyCallback
  )
);

export const authenticateGoogle = (req, res) =>
  new Promise((resolve, reject) => {
    passport.authenticate(
      "google-token",
      { session: false },
      (err, data, info) => {
        if (err) reject(err);
        resolve({ data, info });
      }
    )(req, res);
  });
