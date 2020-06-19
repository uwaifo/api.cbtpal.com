// import dotenv from "dotenv";
// import jwt from "jsonwebtoken";

// import Professional from "../../models/user_types/professional";

// dotenv.config();

// export default {
//   verify_user_email: async (req, res, next) => {
//     try {
//       const token = jwt.verify(req.params.token, process.env.EMAIL_SECRET);
//       if (!token) {
//         return res.redirect("https://pro.motionwares.com/verify-error");
//       }

//       // Check if user has been verified
//       const findUser = await Professional.findById(token.userId);

//       if (!findUser) {
//         return res.redirect("https://pro.motionwares.com/verify-error");
//       }

//       if (findUser.is_verified === true) {
//         return res.redirect(
//           `https://pro.motionwares.com/email-verified?user=${findUser.email}`
//         );
//       }

//       // verify user
//       await Professional.findByIdAndUpdate(
//         token.userId,
//         { is_verified: true },
//         { new: true }
//       );

//       res.redirect(
//         `https://pro.motionwares.com/verify-email?user=${findUser.email}`
//       );
//     } catch (err) {
//       return res.redirect("https://pro.motionwares.com/verify-error");
//     }
//   }
// };
