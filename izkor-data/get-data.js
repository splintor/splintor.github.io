const fs = require('fs');
const fetch = require('node-fetch')

function getData() {
  const baseUrl = 'https://www.izkor.gov.il/search';
  const nextYear = new Date().getFullYear() + 1;
  const initialUrl = `/date/01-01-1800/01-01-${nextYear}/0/10000/d`;
  let list = [];
  const ids = {};
  const fetchData = url => {
    return fetch(baseUrl + url).then(response => response.json()).then(data => {
      const newData = data.data.filter(({ uuid }) => !ids[uuid]);
      if (newData.length === 0) return;
      list = list.concat(newData);
      newData.forEach(({ uuid }) => ids[uuid] = true);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${list.length} found.`);
      const last = list[list.length - 1];
      return fetchData(`/date/${last.death_date}/01-01-${nextYear}/0/10000/d`);
    });
  }

  fetchData(initialUrl).then(async () => {
    fs.writeFileSync('../izkor-data.json', JSON.stringify(list, null, 2));
    process.stdout.write(`\nizkor-data.json was updated.\n`);

    const bucket = 100;
    for (i = 0; i < list.length; i += bucket) {
      await Promise.all(list.slice(i, i + bucket).map((v, vIndex) =>
        list[i + vIndex] && fetch(`https://www.izkor.gov.il/search/memory/presentation/${list[i + vIndex].uuid}`)
          .then(response => response.json())
          .then(d => list[i + vIndex] = { ...list[i + vIndex], ...d.data })
          .catch(e => console.log(`Failed to get "https://www.izkor.gov.il/search/memory/presentation/${list[i + vIndex].uuid}"`))
      ));

      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Got full data for ${i + bucket} items.`);
    }

    fs.writeFileSync('../izkor-full-data.json', JSON.stringify(list, null, 2));
    process.stdout.write(`\nizkor-full-data.json was updated.\n`);
  })
}
getData();
