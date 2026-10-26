import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
function key(value){let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}return 'copy_'+(hash>>>0).toString(16);}
function clean(value){const lines=value.split(/\r\n|\n|\r/);let result='';let last=-1;lines.forEach((l,i)=>{if(/[^ \t]/.test(l))last=i;});lines.forEach((l,i)=>{let line=l.replace(/\t/g,' ');if(i!==0)line=line.replace(/^ +/,'');if(i!==lines.length-1)line=line.replace(/ +$/,'');if(line){if(i!==last)line+=' ';result+=line;}});return result;}
const fields=new Map(), images=new Map();
const add=(value,group)=>{if(value.trim().length>1&&!fields.has(key(value)))fields.set(key(value),{key:key(value),value,group});};
for(const file of ['app/public-pages.tsx','app/public-site.tsx']){
 let source=readFileSync(file,'utf8');
 const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), edits=[];
 function visit(node,group='General'){
  if(ts.isFunctionDeclaration(node)&&node.name){group=node.name.text;if(file.includes('public-site')&&group!=='LegalContent')return;}
  if(file.includes('public-site')&&!['LegalContent'].includes(group)){ts.forEachChild(node,n=>visit(n,group));return;}
  if(ts.isJsxText(node)){const value=clean(node.getFullText(tree));if(value.trim().length>1){add(value,group);edits.push({start:node.pos,end:node.end,value:'<Copy value={'+JSON.stringify(value)+'}/>'});}}
  if(ts.isJsxAttribute(node)&&['eyebrow','title','text','accent','label'].includes(node.name.text)&&node.initializer){
   const walk=n=>{if(ts.isStringLiteral(n))add(n.text,group);ts.forEachChild(n,walk);};walk(node.initializer);
  }
  if(file.includes('public-pages')&&(ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node))&&node.tagName.getText(tree)==='img'){
   const attr=node.attributes.properties.find(x=>ts.isJsxAttribute(x)&&x.name.text==='src');
   const literal=attr?.initializer?.expression;
   if(literal&&ts.isCallExpression(literal)&&literal.expression.getText(tree)==='mediaHref'&&ts.isStringLiteral(literal.arguments[0])){
    const path=literal.arguments[0].text, imageKey='image_'+key(path).slice(5);
    images.set(imageKey,{key:imageKey,url:new URL(path,'https://sinteriaproducciones.github.io/sinteria-producciones./').href,label:group+' · '+path.split('/').pop()});
    edits.push({start:node.tagName.getStart(tree),end:node.tagName.end,value:'SiteImage imageKey="'+imageKey+'"'});
   }
  }
  ts.forEachChild(node,n=>visit(n,group));
 }
 visit(tree);
 for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.value+source.slice(e.end);
 writeFileSync(file,source);
}
const source=readFileSync('app/public-pages.tsx','utf8'), tree=ts.createSourceFile('pages.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function extra(node){
 if(ts.isVariableDeclaration(node)&&['introPhotos'].includes(node.name.getText(tree))){
  function collect(n){if(ts.isPropertyAssignment(n)&&n.name.getText(tree)==='caption'&&ts.isStringLiteral(n.initializer))add(n.initializer.text,'Presentación de páginas');ts.forEachChild(n,collect);}collect(node);
 }
 ts.forEachChild(node,extra);
}extra(tree);
const orig=readFileSync('app/public-site.tsx','utf8'), qtree=ts.createSourceFile('site.tsx',orig,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function questions(node){if(ts.isVariableDeclaration(node)&&node.name.getText(qtree)==='questions'){function collect(n){if(ts.isStringLiteral(n))add(n.text,'Preguntas frecuentes');ts.forEachChild(n,collect);}collect(node);}ts.forEachChild(node,questions);}questions(qtree);
for(const [id,path] of Object.entries({servicios:'117020.jpg',catalogo:'117024.jpg',galeria:'portada-fiesta-768.webp',nosotros:'117021.jpg',contacto:'117022.jpg',condiciones:'117020.jpg',privacidad:'117023.jpg'}))images.set('intro_'+id,{key:'intro_'+id,url:'https://sinteriaproducciones.github.io/sinteria-producciones./media/'+path,label:'Cabecera · '+id});
images.set('contact_photo',{key:'contact_photo',url:'https://sinteriaproducciones.github.io/sinteria-producciones./media/portada-fiesta-768.webp',label:'Foto del formulario de contacto'});
['portada-fiesta-768.webp','117020.jpg','117022.jpg','117024.jpg'].forEach((file,i)=>images.set('occasion_'+i,{key:'occasion_'+i,url:'https://sinteriaproducciones.github.io/sinteria-producciones./media/'+file,label:['Cumpleaños','Matrimonios','Quinceañeros','Eventos de empresa'][i]}));
writeFileSync('lib/editor-fields.ts','export const editableTextFields = '+JSON.stringify([...fields.values()],null,2)+';\nexport const editableImageFields = '+JSON.stringify([...images.values()],null,2)+';\n');
console.log(JSON.stringify({editableTexts:fields.size,editableImages:images.size}));
