// Windows can report EPERM for an already-existing directory during parallel
// Next output generation. Preserve mkdir semantics; never relax permissions.
/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preload must be CommonJS. */
const fs = require('node:fs');
const path = require('node:path');
const original = fs.promises.mkdir.bind(fs.promises);
const originalCallback = fs.mkdir.bind(fs);
const outputRoot = path.resolve(process.cwd(), '.next-auth') + path.sep;
function outputPath(p) { return process.platform === 'win32' && path.resolve(String(p)).startsWith(outputRoot); }
fs.promises.mkdir = async function(p, options) {
  for (let n=0;;n++) {
    try { return await original(p,options); }
    catch(e) {
      if(e.code!=='EPERM'||!outputPath(p)||!options?.recursive) throw e;
      // A directory already satisfies recursive mkdir's contract.
      if((await fs.promises.stat(p).catch(()=>null))?.isDirectory()) return;
      if(n>=8) throw e;
      await new Promise(r=>setTimeout(r,25*(n+1)));
    }
  }
};
fs.mkdir = function(p, options, callback) {
  if(typeof options==='function'){callback=options;options=undefined;}
  let n=0;
  function attempt(){
    originalCallback(p,options,(error,made)=>{
      if(!error||error.code!=='EPERM'||!outputPath(p)) return callback(error,made);
      fs.stat(p,(statError,stat)=>{
        if(!statError&&stat.isDirectory()) {
          if(options?.recursive) return callback(null);
          error.code='EEXIST'; return callback(error);
        }
        if(n++>=8) return callback(error);
        setTimeout(attempt,25*n);
      });
    });
  }
  attempt();
};
require('node:module').syncBuiltinESMExports();
