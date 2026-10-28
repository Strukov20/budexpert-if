export function parseCsv(text){
    const rows = []
    let row = []
    let cur = ''
    let inQ = false
    for(let i=0;i<text.length;i++){
      const ch = text[i]
      if(inQ){
        if(ch==='"'){
          if(text[i+1]==='"'){ cur+='"'; i++; }
          else inQ=false
        } else {
          cur+=ch
        }
      } else if(ch==='"'){
        inQ=true
      } else if(ch===','){
        row.push(cur); cur=''
      } else if(ch==='\r'){
        // ignore, обробляється разом з \n
      } else if(ch==='\n'){
        row.push(cur); cur=''; rows.push(row); row=[]
      } else {
        cur+=ch
      }
    }
    if(cur.length>0 || row.length>0){ row.push(cur); rows.push(row) }

    const dataRows = rows.filter(r=> r.some(c=> c.trim().length>0))
    if (dataRows.length===0) return []
    const header = dataRows[0].map(h=> h.trim())
    return dataRows.slice(1).map(cols=>{
      const obj = {}
      header.forEach((h,idx)=>{ obj[h] = (cols[idx]||'').trim() })
      return obj
    })
  }
