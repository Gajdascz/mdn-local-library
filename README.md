# MDN Local Library

This project, developed as part of [The Odin Project](https://www.theodinproject.com/lessons/nodejs-express-105-forms-and-deployment), follows the Mozilla Developer Network's [Node/Express introduction tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs). The goal of the project was to develop a simple express application that manages data similar to a small local library.

## Learning Outcome

- **Express**
  - Set up and structured a series of regular and parameterized routes.
  - Explored a large collection of useful libraries:
    - **compression:** Reduces the size of served content, which improves load time and resource usage.
    - **helmet:** Provides security by setting various HTTP headers.
    - **debug:** Allows console logging based on node environment and namespaces.
    - **express-rate-limit:** Configurable client request restrictions.
    - **morgan:** HTTP request logger middleware.
    - **dotenv:** Loads environment variables from .env file into process.env.
- **MongoDB/Mongoose**
  - Configured and deployed a Mongo DataBase using the Mongoose library.
  - Gained working-knowledge of how to handle asynchronous database queries, errors/exceptions, and general Mongoose usage.
- **Model-View-Controller (MVC) Architecture**
  - Created a MVC architecture where the:
    - **Model:** Manages data schema properties.
    - **View:** Provides templates rendered using model data.
    - **Controller:** Interfaces between model and view, handling input/requests to retrieve data from the model and render views.
- **Pug**
  - Learned how to use and work with the [Pug template engine](https://pugjs.org/api/getting-started.html) to render dynamic webpages.
- **Fullstack App Deployment**
  - Deployed the application using [Railway](https://railway.app/), which provides a robust and intuitive platform for fullstack app deployment.
