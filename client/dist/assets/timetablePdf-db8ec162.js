const D=o=>String(o??"").replace(/[^\x20-\x7E]/g," ").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)"),G=(o,s=[255,255,255])=>{const c=String(o||"").replace("#","").trim();return/^[0-9a-f]{6}$/i.test(c)?[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]:s},j=(o,s="rg")=>{const[c,r,a]=G(o);return`${(c/255).toFixed(3)} ${(r/255).toFixed(3)} ${(a/255).toFixed(3)} ${s}`},K=(o,s)=>{const c=String(o??"").split(/\s+/).filter(Boolean),r=[];let a="";return c.forEach(m=>{const u=a?`${a} ${m}`:m;u.length>s&&a?(r.push(a),a=m):a=u}),a&&r.push(a),r.length?r:[""]},$=(o,s)=>`${o} 0 obj
${s}
endobj
`,N=({title:o,headers:s,rows:c,filename:r="timetable.pdf"})=>{const w=690/Math.max(s.length-1,1),F=s.map((t,e)=>e===0?96:w),x=58,R=30,M=28,b=[];let i=595-28,p="";const H=(t,e,n,g,d="#ffffff",W="#cbd5e1")=>{p+=`${j(d,"rg")}
${t.toFixed(2)} ${e.toFixed(2)} ${n.toFixed(2)} ${g.toFixed(2)} re f
`,p+=`${j(W,"RG")}
${t.toFixed(2)} ${e.toFixed(2)} ${n.toFixed(2)} ${g.toFixed(2)} re S
`},T=(t,e,n,g=9,d="#111827")=>{p+=`BT /F1 ${g} Tf ${j(d,"rg")} ${e.toFixed(2)} ${n.toFixed(2)} Td (${D(t)}) Tj ET
`},P=()=>{b.push(p),p=""},C=()=>{T(o,28,i,18,"#0f172a"),i-=28;let t=28;s.forEach((e,n)=>{H(t,i-R,F[n],R,"#0f2f5f","#0f2f5f"),T(e,t+6,i-19,9,"#ffffff"),t+=F[n]}),i-=R};C(),c.forEach(t=>{i-x<M&&(P(),i=567,C());let e=28;t.cells.forEach((n,g)=>{const d=F[g],W=n.fill||(t.type==="break"?"#e8f7e9":"#ffffff");H(e,i-x,d,x,W,"#cbd5e1");const _=Math.max(Math.floor(d/5.2),8);K(n.text,_).slice(0,4).forEach((z,k)=>{T(z,e+6,i-16-k*11,k===0&&n.bold?9:8,n.color||"#111827")}),e+=d}),i-=x}),P();const f=[],I=1,y=2,S=3,E=b.map((t,e)=>4+e*2),L=b.map((t,e)=>5+e*2);f.push($(I,`<< /Type /Catalog /Pages ${y} 0 R >>`)),f.push($(y,`<< /Type /Pages /Kids [${E.map(t=>`${t} 0 R`).join(" ")}] /Count ${E.length} >>`)),f.push($(S,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")),b.forEach((t,e)=>{f.push($(E[e],`<< /Type /Page /Parent ${y} 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${S} 0 R >> >> /Contents ${L[e]} 0 R >>`)),f.push($(L[e],`<< /Length ${t.length} >>
stream
${t}endstream`))});let l=`%PDF-1.4
`;const B=[0];f.forEach(t=>{B.push(l.length),l+=t});const U=l.length;l+=`xref
0 ${f.length+1}
0000000000 65535 f 
`,B.slice(1).forEach(t=>{l+=`${String(t).padStart(10,"0")} 00000 n 
`}),l+=`trailer
<< /Size ${f.length+1} /Root ${I} 0 R >>
startxref
${U}
%%EOF`;const v=new Blob([l],{type:"application/pdf"}),O=URL.createObjectURL(v),h=document.createElement("a");h.href=O,h.download=r,document.body.appendChild(h),h.click(),document.body.removeChild(h),URL.revokeObjectURL(O)};export{N as d};
