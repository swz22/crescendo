import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";

import "./index.css";
import App from "./App";
import { store } from "./redux/store";
import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <Router>
          <App />
        </Router>
      </ToastProvider>
    </Provider>
  </React.StrictMode>
);
