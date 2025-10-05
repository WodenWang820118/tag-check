// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDICii4NRsaRPqn5QCZh5kaEPaxd9ZvLGQ",
  authDomain: "ng-gtm-integration.firebaseapp.com",
  projectId: "ng-gtm-integration",
  storageBucket: "ng-gtm-integration.appspot.com",
  messagingSenderId: "564340780055",
  appId: "1:564340780055:web:97b78b49dba10e27df4052"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export { app };