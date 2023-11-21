### Getting started

#### In your web browser

1. **Access the Transaction List**: Open your web browser and go to [https://csvw-demo.learndata.info/transactions/](https://csvw-demo.learndata.info/transactions/). Here, you will see a list of all available transactions.

2. **Understanding the Transaction List**:
   - Each row represents a different transaction.
   - The columns represent various attributes of the transactions, such as date, amount, description, etc.

3. **Viewing a Specific Transaction**:
   - To view a specific transaction, click on its corresponding link in the list under the @id column
   - This will take you to a new page (e.g., [https://csvw-demo.learndata.info/transactions/1](https://csvw-demo.learndata.info/transactions/1)) where you can see all the details of the selected transaction.

---

### Using HTTPie.io/app to Fetch Data in Different Formats and Languages

HTTPie.io/app is a web-based service that allows you to make HTTP requests directly from your browser.

1. **Access HTTPie.io/app**: Open your web browser and go to [https://httpie.io/app](https://httpie.io/app).

2. **Making a GET Request**:
   - In the URL field, enter the URL of the transaction you want to view, e.g., `https://csvw-demo.learndata.info/transactions/1` (single transaction) or `https://csvw-demo.learndata.info/transactions/` (all transactions).
   - Click on the "Send" button to make the request.

3. **Specifying Accept-Language**:
   - To request data in a specific language, click on the "Headers" tab.
   - Add a new header with `Name` set to `Accept-Language` and `Value` set to the desired language code, currently only `fr` is supported in addition to `en`.
   - Click "Send" to make the request.
   - Note, if look at the web page, only the column headings will be translated.

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

---

#### Other pages

**About this tool**: Describes the tool, how it works and how it converts CSV data into full linked data via the CSV on the Web (CSVW) standard.

**About this data**: Provides a description of how the data you are looking at has been generated. Note that the tool uses many examples with increased complexity. The current version you are looking at is highlighted by the banner in the top right of the screen.

**View CSV**: View the original CSV file that has been translated into linked data via the CSVW standard.

**View CSVW**: View the CSVW metadata that enables the translation into linked data.

**View JSON-LD**: View the resulting linked data that has been generated from the original CSV and CSVW metadata.