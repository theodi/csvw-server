### Viewing Data in Your Browser

#### Browsing Transactions

1. **Access the Transaction List**: Open your web browser and go to [https://jmpc.learndata.info/transactions/](https://jmpc.learndata.info/transactions/). Here, you will see a list of all available transactions.

2. **Understanding the Transaction List**:
   - Each row represents a different transaction.
   - The columns represent various attributes of the transactions, such as date, amount, description, etc.

3. **Viewing a Specific Transaction**:
   - To view a specific transaction, click on its corresponding link in the list under the @id column
   - This will take you to a new page (e.g., [https://jmpc.learndata.info/transactions/1](https://jmpc.learndata.info/transactions/1)) where you can see all the details of the selected transaction.

#### Understanding the Transaction Detail Page

1. **About section**: This section introduces the service and provides information on the example data you are looking at. The tutor can change the data loaded during the teaching session.

2. **Metadata and Data Section**: This section presents the actual data, along with the descriptive metadata (if present) in a human-readable format. The labels are derived from the vocabulary used to describe the data, ensuring that you understand the context of each piece of information.

3. **Source dat section**: Here, you see the original raw data in CSV, CSVW metadata as well as the JSON-LD that was compiled from the two. The CSV content is displayed in a table format, while the JSON content is displayed with syntax highlighting for better readability.

---

### Using HTTPie.io/app to Fetch Data in Different Formats and Languages

HTTPie.io/app is a web-based service that allows you to make HTTP requests directly from your browser.

1. **Access HTTPie.io/app**: Open your web browser and go to [https://httpie.io/app](https://httpie.io/app).

2. **Making a GET Request**:
   - In the URL field, enter the URL of the transaction you want to view, e.g., `https://jmpc.learndata.info/transactions/1` (single transaction) or `https://jmpc.learndata.info/transactions/` (all transactions).
   - Click on the "Send" button to make the request.

3. **Specifying Accept-Language**:
   - To request data in a specific language, click on the "Headers" tab.
   - Add a new header with `Name` set to `Accept-Language` and `Value` set to the desired language code, currently only `fr` is supported in addition to `en`.
   - Click "Send" to make the request.

4. **Fetching Data in Different Formats**:
   - To fetch data in different formats, add an `Accept` header with the desired content type.
   - For CSV: `text/csv`
   - For JSON: `application/json`
   - For JSON-LD: `application/ld+json`
   - For HTML: `text/html`
   - After setting the header, click "Send" to make the request.

5. **Viewing the Response**:
   - The response will be displayed in the lower part of the screen.
   - You can view the status code, headers, and response body.

By following these steps, you can easily view and fetch transaction data in various formats and languages using HTTPie.io/app directly from your web browser.