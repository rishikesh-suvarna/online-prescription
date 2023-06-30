*Old Portfolio Project*

# Online Prescription System

*Built as a test for Interview Process*.

Back-End: NodeJS, ExpressJS Framework
Front-End: EJS (Embedded Javascript) templates
Database: MongoDB NoSQL

You’ll need to install NodeJS & MongoDB  in order to run this project

* Once installed open the terminal at project path and run “npm install / npm i”

* This will install all the necessary dependencies for the project, which can be seen in package.json file

* Setup .env variables from .env.example
 
* Run “node app.js“  to start the project on localhost, PORT = 3000.

* You’ll see “Server started on port 3000” in the terminal and “Database connected“ once the database connection is established.

Once done, Project can be opened on “http://localhost:3000”.

Folder Structure
* Public: Stores all static files ex: CSS, Javascript
* Views: Stores all the view templated ex: HTML, EJS files
* Models: Stores the database schema
* Routes: Stores all RouterJS files
* Middleware: Stores custom middlewares for routes


>Using PassportJS library for Authentication.
>Using Multer library for Storage Engine.
>Using Puppeteer library for PDF generation.

>Added a demo folder with dummy doctor & patient profile pictures (if needed).

>All forms are validated from back-end as well as front-end.
>Once the doctor consults the patient pdf is generated & the patient can view it in their respective profile. 
>Delete Button is not yet implemented for profiles as it was not a requirement.

