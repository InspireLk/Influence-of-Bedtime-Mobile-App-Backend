const express = require("express");
const router = express.Router();
const {
  submitSurvay
} = require("../controllers/userController");
const { predictBedtime, addToken } = require("../controllers/BedtimePredictController");
const { testNotification } = require("../controllers/NotificationController");



router.route("/submit_survay/:_id").post(submitSurvay);
router.route("/predict_bedtime/:_id/:stepCount").get(predictBedtime);

router.route("/submit_token/:_id").post(addToken);

router.get('/test-notification', testNotification);




module.exports = router;