const paginate = (page = 1, limit = 10) => {
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
  
    const skip = (parsedPage - 1) * parsedLimit;
  
    return { skip, limit: parsedLimit };
  };
  
  export default paginate;
  