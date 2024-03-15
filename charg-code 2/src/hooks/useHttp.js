import { useState, useEffect } from 'react';

export const useHttp = (url, dependencies=[], data=null, method='GET') => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  useEffect(() => {
    if (dependencies.length>0 && !dependencies[0]) {
      setIsLoading(false); return;
    }
    setIsLoading(true);
    const options = {
        method: method, // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
    }

    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch.');
        }
        return response.json();
      })
      .then(data => {
        setIsLoading(false);
        setFetchedData(data);
      })
      .catch(err => {
        setIsLoading(false);
      });
  }, dependencies);

  return [isLoading, fetchedData];
};
