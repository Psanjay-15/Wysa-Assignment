const getApiError = (error) => {
  if (error.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }

  if (!error.response) {
    return "Could not reach the API. Make sure the backend server is running.";
  }

  return error.response.data?.message || "Something went wrong. Please try again.";
};

export default getApiError;
