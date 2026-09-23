(function(){"use strict";let e=null;self.onmessage=t=>{t.data==="start"?(e&&clearInterval(e),e=setInterval(()=>{self.postMessage("tick")},1e3)):t.data==="stop"&&e&&(clearInterval(e),e=null)}})();
