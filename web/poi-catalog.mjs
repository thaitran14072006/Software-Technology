// Apply the current catalog to old browser/offline lists without losing audio bytes.
export function currentCatalogItems(items,seed,{cached=false}={}) {
  if(!seed?.catalogVersion)return items;
  const byCode=new Map(seed.pois.map((p,i)=>[p.code,{...p,sortOrder:p.sortOrder||i+1}]));
  return items.filter(p=>byCode.has(p.code)).map(p=>{
    const current=byCode.get(p.code);
    if(!cached)return {...p,sortOrder:current.sortOrder};
    const tr=current.translations.find(t=>t.langCode===p.lang);
    return {...p,lat:current.lat,lng:current.lng,geoVerified:current.geoVerified,geoSourceUrl:current.geoSourceUrl,sortOrder:current.sortOrder,...(tr?{name:tr.name}:{} )};
  }).sort((a,b)=>a.sortOrder-b.sortOrder);
}
