## Exploring CSVW Examples: From Basic to Advanced

The ODI CSVW Data Browser presents a series of examples, ranging from Example1 to Example4, each illustrating the progressive enhancement of CSV files using CSV on the Web (CSVW) metadata. These examples provide a practical journey through the capabilities of CSVW, showing how plain CSV data can be transformed into rich, linked data.

The example you are currently viewing can be seen in the top right corner in the banner.

**NOTE** The example loaded is the same for everyone, so if you change it, it changes for everyone! So keep an eye out if it changes.

### Starting with Example1

- **Begin with Example1**: Start your exploration with Example1, which offers a basic application of CSVW. This example will introduce you to how to create a table-schema in CSVW to describe the structure of an existing CSV. At each stage click *View CSVW* and examine the structure of the metadata file, which is described at each stage.
- **Explore the data**: At each stage explore the data via your web browser and also via content negotiation and observe how the data changes depending on the complexity of the CSVW metadata.

### Progressing through the Examples

- **Move to Subsequent Examples**: After reviewing Example1, proceed to Example2, Example3, and finally Example4. With each step, you'll observe the introduction of more advanced CSVW features, each of which is detailed on the *View CSVW* page.
- **Understand the Power of CSVW**: As you progress, you'll see how CSVW transforms a simple CSV into a dataset that's not only self-describing but also linked and ready for integration with other web resources.

### Realizing the Full Potential

- **Full Linked Data Transformation**: By the time you reach Example4, you'll witness the full potential of CSVW. The plain CSV data from Example1 evolves into a comprehensive linked data set, showcasing the true power of CSVW in enhancing data interoperability and usability.
- **Utilize Tools for Exploration**: During the early examples you will be able to use tools like the [CSVW Validation Tool](https://csvw.opendata.cz/validation) to understand how well the CSVW metadata adheres to the CSVW standard. For the later examples, use tools like the [JSON-LD Playground](https://json-ld.org/playground/) to interact with the JSON-LD output via the *View JSON-LD* page and discover what linked data has been created.

### Exploring the data (web browser)

1. **Access the Transaction List**: Open your web browser and go to [https://csvw-demo.learndata.info/transactions/](https://csvw-demo.learndata.info/transactions/). Here, you will see a list of all available transactions.

2. **Understanding the Transaction List**:
   - Each row represents a different transaction.
   - The columns represent various attributes of the transactions, such as date, amount, description, etc.

3. **Viewing a Specific Transaction**:
   - To view a specific transaction, click on its corresponding link in the list under the @id column
   - This will take you to a new page (e.g., [https://csvw-demo.learndata.info/transactions/1](https://csvw-demo.learndata.info/transactions/1)) where you can see all the details of the selected transaction.

#### Other pages

**About this tool**: Describes the tool, how it works and how it converts CSV data into full linked data via the CSV on the Web (CSVW) standard.

**View CSV**: View the original CSV file that has been translated into linked data via the CSVW standard.

**View CSVW**: View the CSVW metadata that enables the translation into linked data as well as a description of the configuration it contains.

**View JSON-LD**: View the resulting linked data that has been generated from the original CSV and CSVW metadata.

---

### Exploring data in different formats (via content negiation)

The real power of linked data is only evident once you start to discover the alternative formats for data. While these have been shown in the web interface, machines prefer to use a technique called content negotiation to access raw data, rather than web pages.

You can use a service like HTTPie.io/app to make HTTP requests directly from your browser.

1. **Access HTTPie.io/app**: Open your web browser and go to [https://httpie.io/app](https://httpie.io/app).

2. **Making a GET Request**:
   - In the URL field, enter the URL of the transaction you want to view, e.g., `https://csvw-demo.learndata.info/transactions/1` (single transaction) or `https://csvw-demo.learndata.info/transactions/` (all transactions).
   - Click on the "Send" button to make the request.
   - The response will be the human readable web page (the default)

3. **Viewing the Response**:
   - The response will be displayed in the lower part of the screen.
   - You can view the status code, headers, and response body.

4. **Specifying Accept-Language**:
   - To request data in a specific language, click on the "Headers" tab.
   - Add a new header with `Name` set to `Accept-Language` and `Value` set to the desired language code, currently only `fr` is supported in addition to `en`.
   - Click "Send" to make the request.
   - Note, if look at the web page, only the column headings will be translated.

5. **Fetching Data in Different Formats**:
   - To fetch data in different formats, add an `Accept` header with the desired content type.
   - For CSV: `text/csv`
   - For JSON: `application/json`
   - For JSON-LD: `application/ld+json`
   - For HTML: `text/html`
   - After setting the header, click "Send" to make the request.

By following these steps, you can easily view and fetch transaction data in various formats and languages using HTTPie.io/app directly from your web browser.