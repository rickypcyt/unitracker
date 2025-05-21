
let timer;
let endTime;

self.onmessage = function(e) {
  switch(e.data.action) {
    case 'START':
      endTime = Date.now() + e.data.duration * 1000;
      timer = setInterval(() => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) {
          clearInterval(timer);
          self.postMessage('finished');
        } else {
          self.postMessage('tick');
        }
      }, 1000);
      break;
      
    case 'PAUSE':
      clearInterval(timer);
      break;
  }
};