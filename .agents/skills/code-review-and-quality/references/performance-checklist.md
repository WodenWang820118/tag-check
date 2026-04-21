# Performance Review Checklist

This checklist provides a more detailed set of questions for the "Performance" axis of a code review.

## Common Performance Bottlenecks

- **[ ] N+1 Queries:** Is the code fetching a list of items, and then looping through that list to fetch details for each item individually?
  - **Example:** Fetching 100 blog posts, then running a separate query inside the loop for each post's author.
  - **Fix:** Use a single query with a `JOIN` or a second query with a `WHERE IN (...)` clause to fetch all the required data at once.

- **[ ] Unbounded Data Fetching:** Is there a query that could return a very large number of rows?
  - **Example:** A `get_all_users()` endpoint.
  - **Fix:** Always implement pagination. The client should request data in pages (e.g., `?page=1&limit=100`).

- **[ ] Large Objects in Memory:** Is the code loading very large files or database records into memory?
  - **Example:** Reading a multi-gigabyte log file into a single string.
  - **Fix:** Use streaming APIs to process the data in chunks.

- **[ ] Synchronous Operations on Hot Paths:** Is there a blocking I/O operation (network, filesystem) on a main thread that handles user requests?
  - **Example:** Calling a slow third-party API synchronously inside a web request handler.
  - **Fix:** Use asynchronous patterns (`async`/`await`, promises, callbacks) to avoid blocking.

- **[ ] Inefficient UI Rendering:** (For frontend code)
  - **Example:** A React component re-rendering on every keystroke in a text field, even if the component doesn't depend on that text.
  - **Fix:** Use memoization (`React.memo`), selectors (`Reselect`), or other state management techniques to prevent unnecessary re-renders. Ensure `key` props are stable and unique for lists.

- **[ ] Unnecessary Computation in Loops:** Is there a calculation inside a loop that could be performed just once outside of it?
  - **Example:** Calculating `new Date()` on every iteration of a tight loop.

- **[ ] Missing Indexes:** (For database-heavy code) Are queries running against columns that are not indexed?
  - **Fix:** Check the query plan (`EXPLAIN`) for slow queries and add indexes where appropriate, especially on foreign key columns and columns used in `WHERE` clauses.
