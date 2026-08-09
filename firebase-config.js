/* Firebase configuration for the shared birthday-wishes wall. */
const firebaseConfig = {
  apiKey: "AIzaSyCH4edQDmR22XKnMtCCFeR-PgKJ6TmR-Xg",
  authDomain: "bdaykit911.firebaseapp.com",
  databaseURL: "https://bdaykit911-default-rtdb.firebaseio.com",
  projectId: "bdaykit911",
  storageBucket: "bdaykit911.firebasestorage.app",
  messagingSenderId: "254539194187",
  appId: "1:254539194187:web:a241bac3ee97360125d2ce",
  measurementId: "G-79F4CM6J1R"
};

firebase.initializeApp(firebaseConfig);
// Expose it on window so script.js can safely access it after this file loads.
window.birthdayWishesDb = firebase.database();
