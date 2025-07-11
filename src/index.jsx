import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import { store } from "./redux/store";
import { ToastProvider } from "./context/ToastContext";
import { AppProvider } from "./context/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppProvider>
        <ToastProvider>
          <Router>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </Router>
        </ToastProvider>
      </AppProvider>
    </Provider>
  </React.StrictMode>
);
