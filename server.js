import api from "./app.js";

const PORT = process.env.PORT || 5000;

api.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
