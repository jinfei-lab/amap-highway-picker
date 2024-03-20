const x_PI = (3.14159265358979324 * 3000.0) / 180.0;
const PI = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

/**
 * 判断是否在国内，不在国内则不做偏移
 * @param {*} lng
 * @param {*} lat
 */
const outOfChina = (lng, lat) => {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false;
};

/**
 * 经度转换
 * @param { Number } lng
 * @param { Number } lat
 */
function transformlat(lng, lat) {
  var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

/**
 * 纬度转换
 * @param { Number } lng
 * @param { Number } lat
 */
function transformlng(lng, lat) {
  var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

/**
 * WGS84坐标系转火星坐标系GCj02 / 即WGS84 转谷歌、高德
 * @param { Number } lng:需要转换的经纬
 * @param { Number } lat:需要转换的纬度
 * @return { Array } result: 转换后的经纬度数组
 */
const wgs84togcj02 = (lng, lat) => {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  } else {
    var dlat = transformlat(lng - 105.0, lat - 35.0);
    var dlng = transformlng(lng - 105.0, lat - 35.0);
    var radlat = (lat / 180.0) * PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
    const mglat = lat + dlat;
    const mglng = lng + dlng;
    return [mglng, mglat];
  }
};

// 定义一个函数，用于将 GeoJSON 中的坐标从 WGS84 转换为 GCJ02
function convertGeoJSONCoordinates(geojson) {
  // 遍历所有的 Feature，对其坐标进行转换
  geojson.features.forEach(function (feature) {
    // 如果 Feature 是一个点（Point）类型
    if (feature.geometry.type === "Point") {
      var lng = feature.geometry.coordinates[0]; // 经度
      var lat = feature.geometry.coordinates[1]; // 纬度

      // 使用 wgs84togcj02 函数进行坐标转换
      var [mglng, mglat] = wgs84togcj02(lng, lat);

      // 更新转换后的坐标值
      feature.geometry.coordinates[0] = mglng;
      feature.geometry.coordinates[1] = mglat;
    }
    // 如果 Feature 是一个线（LineString）类型
    else if (feature.geometry.type === "LineString") {
      // 遍历线的每个坐标点并进行转换
      feature.geometry.coordinates.forEach(function (coord, index) {
        var lng = coord[0]; // 经度
        var lat = coord[1]; // 纬度

        // 使用 wgs84togcj02 函数进行坐标转换
        var [mglng, mglat] = wgs84togcj02(lng, lat);

        // 更新转换后的坐标值
        feature.geometry.coordinates[index][0] = mglng;
        feature.geometry.coordinates[index][1] = mglat;
      });
    } else if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates[0].forEach(function (coord, index) {
        var lng = coord[0]; // 经度
        var lat = coord[1]; // 纬度

        // 使用 wgs84togcj02 函数进行坐标转换
        var [mglng, mglat] = wgs84togcj02(lng, lat);

        // 更新转换后的坐标值
        feature.geometry.coordinates[0][index][0] = mglng;
        feature.geometry.coordinates[0][index][1] = mglat;
      });
    }
    // 如果 Feature 是其他类型，你可以根据需要进行相应处理
  });

  // 返回转换后的 GeoJSON 数据
  return geojson;
}

