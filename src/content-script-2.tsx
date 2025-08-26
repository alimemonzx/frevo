// import { createRoot } from "react-dom/client";
// import FrevoUser from "./components/FrevoUser";

// Function to inject the interceptor script
function injectInterceptor() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("interceptor.js");
  script.onload = function () {
    console.log("✅ API interceptor script injected successfully");
    this.remove(); // Clean up the script element after loading
  };
  script.onerror = function () {
    console.error("❌ Failed to inject API interceptor script");
    this.remove();
  };

  (document.head || document.documentElement).appendChild(script);
}

// Inject the interceptor script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectInterceptor);
} else {
  injectInterceptor();
}

// Injection function
// function injectIntoCardBody(image: string, name: string, username: string) {
//   const cardBody = document.querySelector(
//     '.CardBody[data-flex-direction="column"]'
//   );

//   if (!cardBody || cardBody.querySelector("#extension-analyzer")) {
//     return;
//   }

//   const container = document.createElement("div");
//   container.id = "extension-analyzer";

//   const shadowRoot = container.attachShadow({ mode: "closed" });
//   const reactRoot = document.createElement("div");
//   shadowRoot.appendChild(reactRoot);

//   const root = createRoot(reactRoot);
//   // root.render(<FrevoUser image={image} name={name} username={username} />);
//   root.render(
//     React.createElement(FrevoUser, {
//       image: image,
//       name: name,
//       username: username,
//     })
//   );

//   // Insert after project title
//   const heading = cardBody.querySelector("fl-heading");
//   if (heading) {
//     heading.insertAdjacentElement("afterend", container);
//   }
// }

window.addEventListener("message", (event) => {
  if (event.data.type === "OWNER_API_INTERCEPTED") {
    console.log("🔄 Owner API intercepted:", event.data.owner_id);

    fetch(
      `https://www.freelancer.com/api/users/0.1/users?role=employer&rehire_rates=true&users%5B%5D=${event.data.owner_id}&retention_rate=true&webapp=1&compact=true&new_errors=true&new_pools=true&employer_reputation=true&avatar=true`
    )
      .then((response) => response.json())
      .then((data) => {
        const user_data = data.result.users;
        const keys = Object.keys(user_data);
        const user = user_data[keys[0]];
        console.log("🔄 user dataaa:", user_data[keys[0]]);

        // injectIntoCardBody(
        //   user.avatar_large_cdn,
        //   user.public_name,
        //   user.username
        // );
      });
  }
});
