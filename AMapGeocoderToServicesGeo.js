/**
 * 高速服务区信息，利用高德逆地理编码服务获取服务区信息，将获取后的信息添加到geojson的properties.extraData字段中
 **/
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

fetch("./services.geojson")
  .then((response) => {
    return response.json();
  })
  .then((geoJSON) => {
    // 所有的坐标点
    let lnglats = [];
    for (let i = 0; i < geoJSON.features.length; i++) {
      let feature = geoJSON.features[i];
      // console.log(feature.geometry.coordinates[0][0]);
      let lnglat = [];
      if (feature.geometry.type == "Point") {
        lnglat = feature.geometry.coordinates;
      } else if (feature.geometry.type == "Polygon") {
        lnglat = feature.geometry.coordinates[0][0];
      }
      lnglats.push(lnglat);
    }

    const chunkedArray = chunkArray(lnglats, 20);

    let backUpChunkedArray = JSON.parse(JSON.stringify(chunkedArray));
    console.log("所有的坐标点", backUpChunkedArray);

    let geocoder = new AMap.Geocoder({
      city: "340000", // city 指定进行编码查询的城市，支持传入城市名、adcode 和 citycode
      extensions: "all",
    });
    for (let i = 0; i < chunkedArray.length; i++) {
      geocoder.getAddress(chunkedArray[i], function (status, result) {
        if (status === "complete" && result.info === "OK") {
          for (let j = 0; j < result.regeocodes.length; j++) {
            result.regeocodes[j].location = backUpChunkedArray[i][j];
            for (let k = 0; k < geoJSON.features.length; k++) {
              if (geoJSON.features[k].geometry.type == "Point") {
                if (JSON.stringify(backUpChunkedArray[i][j]) === JSON.stringify(geoJSON.features[k].geometry.coordinates)) {
                  geoJSON.features[k].properties.extraData = result.regeocodes[j];
                }
              } else if (geoJSON.features[k].geometry.type == "Polygon") {
                if (JSON.stringify(backUpChunkedArray[i][j]) === JSON.stringify(geoJSON.features[k].geometry.coordinates[0][0])) {
                  geoJSON.features[k].properties.extraData = result.regeocodes[j];
                }
              }
            }
          }
          console.log(geoJSON);
        }
      });
    }
  });
