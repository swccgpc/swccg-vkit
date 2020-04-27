
const AWS = require('aws-sdk');
const s3  = new AWS.S3();

async function allBucketKeys(s3, bucket, prefix) {
  var params = {
    Bucket:    bucket,
    Delimiter: '/',
    Prefix:    prefix
  };
  var allCards = {
    allCardNames: [],
    allCardImages: {}
  } // allCards
  for (;;) {
    var data = await s3.listObjects(params).promise();

    data.CommonPrefixes.forEach((elem) => {
      var key = elem.Prefix.replace(prefix, '').replace('/', '');
      //allCards.allCardNames = allCardNames.concat(key);
      allCards.allCardNames.push(key);
      allCards.allCardImages[key] = 'https://res.starwarsccg.org/vkit/cards/standard/'+key+'/image.png';
      allCards.allCardImages[key + " (WB)"] = 'https://res.starwarsccg.org/vkit/cards/standard/'+key+'/image.png';
      console.log(key);
    });

    if (!data.IsTruncated) {
      break;
    }
    params.Marker = data.NextMarker;
  }

  return allCards;
}

async function main() {
  var allCards = await allBucketKeys(s3, 'res.starwarsccg.org', 'vkit/cards/standard/');
  console.log("final allCardNames:", allCards);
  var allCardsJson = JSON.stringify(allCards);
  var fs = require('fs');
  fs.writeFile('allCards.json', allCardsJson, 'utf8', function (err, data){
    if (err) { console.log(err); }
    else { console.log("Wrote allCards.json"); }
  });
}

main()

