# Rentix Viva Questions and Answers

Use these as study notes and explain the code in your own words. Add examples from your own tests before the demonstration.

## Project overview

### What is Rentix?

Rentix is a full-stack rental marketplace. Customers can find products and request rental dates. Providers manage listings and booking requests. The demo does not collect money.

### What problem does the project address?

Some consumer goods are needed only occasionally. A rental platform can connect a person who has an unused item with someone who needs access for a limited time.

### What is the main workflow?

The customer registers or signs in, browses a listing, selects dates, and submits a request. The server calculates the duration and amount and saves a pending booking. The provider reviews the dates and confirms or rejects the request. The customer can inspect the status and cancel when the policy permits.

## Technologies

### What is React?

React is a JavaScript library for building user interfaces from reusable components. Rentix uses components such as navigation, product cards, forms, and dashboards so that common interface behavior can be shared.

### What is Vite?

Vite runs the frontend during development and bundles the React code for production. The built frontend is static content that can be hosted by a service such as Vercel.

### What are Node.js and Express?

Node.js runs JavaScript outside the browser. Express is a Node.js framework used here to define HTTP routes and middleware for the REST API.

### What is MongoDB?

MongoDB is a document database. Rentix stores user, product, and booking documents in separate collections and relates them with ObjectId references.

### What is Mongoose?

Mongoose is an ODM (Object Data Modeling) library for MongoDB. It defines schemas, field validation, timestamps, references, indexes, and transaction-friendly model queries.

### What is a REST API?

A REST API exposes resources over HTTP. Rentix uses JSON routes such as `GET /api/v1/products` to list products, `POST /api/v1/bookings` to create a booking request, and `PATCH` routes to update statuses.

### What is CRUD?

CRUD means Create, Read, Update, and Delete. For example, providers create a product, read their products, update a listing, and deactivate/remove it. Deletion is a soft delete in the API so existing records remain available for booking history.

## Security

### Why hash passwords?

If a database copy is exposed, a password hash is safer than a stored plaintext password. Rentix uses bcrypt with a work factor to make guessing more expensive. A password is never returned by the API.

### What is JWT?

A JSON Web Token is a signed token that carries claims, such as a user's ID and a CSRF nonce. Rentix stores it in an HTTP-only cookie so browser JavaScript cannot directly read the session token. The token is short-lived.

### Why use an HTTP-only cookie instead of localStorage?

JavaScript cannot read an HTTP-only cookie, reducing exposure of the session credential to client-side script. Cookies are sent automatically with requests, so the API uses a CSRF token header on state-changing requests and a restricted credentialed CORS policy. Production cross-origin cookies require HTTPS.

### What is middleware?

Middleware runs between receiving a request and sending a response. In Rentix, authentication middleware verifies the session, role middleware checks permissions, CSRF middleware checks write requests, and error middleware converts failures into consistent JSON responses.

### How is admin access protected?

Public registration only allows customer or provider. Admin role assignment occurs on the server using a private environment-based seed operation. Admin routes also require an authenticated user whose database role is `admin`.

## Data and rental behavior

### Why use references between collections?

A booking references a customer and product, while a product references its owner. This avoids copying all user and product fields into every record. The booking does snapshot financial values that must remain historically accurate.

### What is a schema?

A schema describes the expected fields, data types, validation rules, and indexes for documents in a collection. The Product schema, for example, limits categories and requires a valid positive daily price.

### How are rental days calculated?

The dates are parsed as UTC date-only values and the server divides the difference by the number of milliseconds in a day. The return date is exclusive, so a request from the 10th to the 13th is three rental days. Equal or reversed dates are rejected.

### How is the total calculated?

The server loads the listing instead of trusting a price from the browser. It multiplies the current daily price by the duration and adds the listing's security deposit. These values are stored on the booking as snapshots.

### How does Rentix avoid overlapping confirmed rentals?

It checks for a confirmed booking where the existing start is before the requested end and the existing end is after the requested start. It checks at request creation and again during provider confirmation. Confirmation uses a MongoDB transaction and updates a shared product version field so competing confirmations for the same product contend. This requires transaction-capable MongoDB such as Atlas; it is not a database-native range constraint.

### Why are requests pending?

The product provider has to approve the requested dates. The booking becomes confirmed only after the provider's action and the server's final availability check.

### Does this application process payment?

No. The application stores `demo_unpaid`, displays a clearly labelled demo total, and does not request card information. A real payment integration would need payment provider workflows, failure handling, refunds, and appropriate security/compliance review.

## Testing and deployment

### What automated tests exist?

Node's built-in test runner checks valid/invalid date-only parsing and duration calculation including the exclusive return date. The manual checklist covers the rest of the workflow; only report manual outcomes after personally running them.

### Why Atlas, Render, and Vercel?

Atlas hosts MongoDB, Render can run the Node/Express API, and Vercel can host the built frontend. The application keeps database and JWT secrets on the server and exposes only the API base URL to the browser.

### What environment variables are important?

`MONGODB_URI` connects the server to Atlas, `JWT_SECRET` signs short-lived sessions, `CLIENT_ORIGIN` restricts which frontend may use credentialed CORS, and `VITE_API_URL` tells the browser which API to call. The MongoDB URI and JWT secret must not use a `VITE_` prefix.

### What would you improve next?

Possible next steps include integration tests against a replica set, provider identity verification, secure image uploads, notifications, reviews, messaging, dispute handling, and real payment/refund processing. The booking conflict path should be tested under concurrent load before any production use.

## Demonstration notes

- **Your local test environment:** [Add after running]
- **Screenshots captured:** [Add your filenames]
- **Issue encountered and resolution:** [Add observed detail]
- **One limitation you would explain:** MongoDB overlap protection relies on transaction-capable deployment and application logic, not a unique date-range index.
