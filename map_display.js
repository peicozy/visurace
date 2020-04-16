
var map;
function init()
{
	// ルート全体が見える範囲に設定する
	map = L.map('map');
	fit_map(LATLNGdata);

	var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
		attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		maxZoom: 19
    });
	tileLayer.addTo(map);
	L.control.scale({ maxWidth: 400, position: 'bottomright', imperial: false }).addTo(map);

	draw();
	setInterval(draw, 100);
}
/*
 **********************************************************************
  ルート全体が入る範囲に地図領域をフィットする
  data = [[35.68,139.69,0],......]  緯度、経度、距離の配列
  2019-10-24 14:51:52 leafret版新規作成
 **********************************************************************
 */
function fit_map(data)
{
	var lat = [];
	var lng = [];

	for(var i=0 ; i<data.length ; i++){
		lat.push( data[i][0] );
		lng.push( data[i][1] );
	}

	var lat_ret = get_max_min(lat);// 緯度latの最大最小
	var lng_ret = get_max_min(lng);// 経度lngの最大最小

	var latlng_ne = L.latLng(lat_ret.max, lng_ret.max);
	var latlng_sw = L.latLng(lat_ret.min, lng_ret.min);
	var bounds = L.latLngBounds(latlng_sw, latlng_ne);

	map.fitBounds(bounds);
}
/*
 **********************************************************************
  最大、最小を返す
 **********************************************************************
 */
function get_max_min(a)
{
	var i = a.length, min = a[0], max = a[0], p;
	while(--i){
		p = a[i];
		if (p < min){
			min = p;
		} else if (p > max){
			max = p;
		}
	}

	var ret = new Object();
	ret.min = min;
	ret.max = max;

	return ret;
}
/*
 **********************************************************************
  サークルを描画する
  h : ヒストグラムデータ
  c : サークルの位置
 **********************************************************************
 */
var CC=[];
function draw_circle_with_histgram(h,c)
{
	for(var i=0 ; i<c.length ; i++){
		var a = c[i].lat;
		var b = c[i].lng;
		var p = [a,b];
		p[0] = a;
		p[1] = b;
		var r = h[i];
		//console.log(p, r);
		//L.circle(p, {radius: 20}).addTo(map);
		CC[i] = L.circle(p, { radius: r, color: "#FF0000", fill: true, weight: 0.5 , fillOpacity: 1.0}).addTo(map);
	}
}
/*
 **********************************************************************
 * 完走タイムから現在時刻の現在位置にマークを移動する
 * 事前にマーキング用のサークルデータは生成しておく
 **********************************************************************
 */
function put_mark(time_str)
{
	var total = 42195;

	// 例 4:40:39 を秒に変換
	var sec = RSLT.str2sec(time_str);

	// 秒速を求める
	var m_per_sec = total / sec;

	// 位置を求める
//	var dis = now_race_time * m_per_sec;
	var dis = race_sec * m_per_sec;

	// オーバーしてたら描画せず
	if(dis > total){
		return;
	}
	
	// disの値を補正する
	var tmp = LATLNGdata[LATLNGdata.length-2];
	var total_distance = tmp[2];
	var real_dis = total_distance * dis / total;

	// 指定位置のピクセル緯度経度を得る
	var l = getLatlng(LATLNGdata, real_dis)

	// 半径
	r = 3;

	var p = [l[0],l[1]];
	return p;
	// 描画する
	var c = L.circle(p, { radius: r, color: "#FFFFFF", fill: true, weight: 1 }).addTo(map);
	// 表示するオブジェクトを先に準備する
	// この関数は現在位置情報のみ返す関数とする
	c.setLatLng(p);
}
/*
 **********************************************************************
 * マーカーの表示
 **********************************************************************
 */
var C3,C4,C5
var mark_flg = 0;
function update_mark()
{
	if(mark_flg == 0){
		var p = [0,0];
		var r = 5;
		C3 = L.circle(p, { radius: r, color: "#FFFFFF", fill: true, weight: 3 }).addTo(map);
		C4 = L.circle(p, { radius: r, color: "#FFFFFF", fill: true, weight: 3 }).addTo(map);
		C5 = L.circle(p, { radius: r, color: "#FFFFFF", fill: true, weight: 3 }).addTo(map);
		mark_flg = 1;
	}
	var p = put_mark("3:00:00");
	C3.setLatLng(p);
	var p = put_mark("4:00:00");
	C4.setLatLng(p);
	var p = put_mark("5:00:00");
	C5.setLatLng(p);
}
/*
 **********************************************************************
 * 距離に応じた色を返す
 **********************************************************************
 */
function dis2color(d,t)
{
	var sR=  0,sB=255,sG=  0;
	var eR=255,eB=  0,eG=  0;
	
	var r = Math.floor( sR + ((eR - sR) * d / t) );
	var g = Math.floor( sG + ((eG - sG) * d / t) );
	var b = Math.floor( sB + ((eB - sB) * d / t) );
	
//	'rgba(155, 187, 89, 0.7)'
	var c = "rgba(" + r + "," + g + "," + b + ",0.8)";
//	alert(c);
	
	return c;
}

// 一度生成したサークルオブジェクトに対してradiusを更新する
function draw_circle_with_histgram2(h)
{
	for(var i=0 ; i<CC.length ; i++){
		var r = h[i];
		//var r = Math.sqrt(h[i]);// 人数の平方を半径とする;
		//console.log(h[i]);
		if(i==0 || i==CC.length-1){
			r = 0;
		}
		CC[i].setRadius(r);
		CC[i].setStyle({color : "#0000FF"});// スタイルを動的に変更する
		var c = dis2color(C[i].dis, 42195);
		CC[i].setStyle({color : c});// スタイルを動的に変更する
	}
}
/*
 **********************************************************************
  描画する
 **********************************************************************
 */
// レースタイム
var race_sec = 0;
// 1描画あたりに進む時間(秒)
var sec_per_draw = 20;
// サークルオブジェクトリスト
var C = null;
// 分解レベル
var LEVEL = 1000;
var flg = 0;
function draw()
{
	// サークル情報の生成
	if(C == null){
		C = get_circleAry();
	    // リザルトの初期化
		RSLT.set_result(result.result,result.leg,result.mode);
	}
	// 選手の位置情報の更新
	RSLT.set_clock(race_sec);
	RSLT.update_result();
	// ヒストグラム化
	var h = RSLT.get_histgram(LEVEL);
	/*
	  サークル描画
	  ヒストグラムデータとサークルデータを紐づける
	*/
	//console.log(C);
	if(flg == 0){
		draw_circle_with_histgram(h,C);
		flg = 1;
	}
	draw_circle_with_histgram2(h);


	// レース時刻の更新
	race_sec += sec_per_draw;
	if(race_sec > 3600*6){
		race_sec = 0;
	}

	update_mark();
}


// クリアマップのテスト
function clearMap(){
	var m = map;

    for(i in m._layers){        
        if(m._layers[i]._path != undefined)
        {
            try{
				console.log(m._layers[i]);
                m.removeLayer(m._layers[i]);
            }
            catch(e){
                console.log("problem with " + e + m._layers[i]);
            }
        }
    }
}

/*
 **********************************************************************
 * ルート上の位置情報を確定する
 **********************************************************************
 */
function get_circleAry()
{
    var circleAry = null;

    // 分解レベル
	var LEVEL = 1000;

	// サークル用オブジェクトを生成する
	// lat:緯度、lng:経度、n:人数 が含まれる

    // 実距離の値を取得
	var tmp = LATLNGdata[LATLNGdata.length-2];// -2は何故?
	var total_distance = tmp[2];

	circleAry = new Array();
	for(var i=0 ; i<LEVEL ; i++){
		circleAry[i] = new Object();

		// 距離の算出を 実距離ベースに変更
		var one = total_distance / LEVEL; // 1レベル単位の距離
		var dis = one * i + one / 2;

		// 実距離から位置を算出
		var ret = getLatlng(LATLNGdata, dis)

		circleAry[i].n = 0;// 人数
		circleAry[i].lat = ret[0];// 緯度
		circleAry[i].lng = ret[1];// 経度
		circleAry[i].x = 0;// 表示座標
		circleAry[i].y = 0;// 表示座標
		circleAry[i].dis = dis;// 距離 論理距離
	}

/*
    // ヒストグラム取得
	var h = RSLT.get_histgram( LEVEL );

	// ヒストグラムデータをサークルオブジェクトに埋め込む
	// map 情報に従って、座標計算する
	for(var i=1 ; i<h.length-1 ; i++){

		circleAry[i].n = h[i];// 値の埋め込み
		// map から座標を算出
		var ret = cnv(map, circleAry[i].lat, circleAry[i].lng);
		circleAry[i].x = ret.x;
		circleAry[i].y = ret.y;

		// ★距離に応じて色変化
		ctx.fillStyle = dis2color(circleAry[i].dis, 42195);

		drawCircle(
			ctx,
			circleAry[i].x,
			circleAry[i].y,
			// ★描画半径
			// マップの縮尺率に応じて変化させること
			Math.sqrt(circleAry[i].n)// 人数の平方を半径とする
			);
    }
    */
    return circleAry;
}


/*
 **********************************************************************
 * 区間A～Bと距離から近似値を算出する
 **********************************************************************
 */
 function approximateLatlng(A,B,dis)
{
	//         緯度   経度  距離
	var ret = [ 0.0 , 0.0 , 0.0 ];

	var total = B[2] - A[2];
	var cur = dis - A[2];

	ret[0] = A[0] + (B[0] - A[0]) * (cur / total);
	ret[1] = A[1] + (B[1] - A[1]) * (cur / total);
	ret[2] = dis;
	
	return ret;
}
/*
 **********************************************************************
	距離を元に、
	もっとも近い緯度、経度を算出する

	1.緯度、経度、距離のリストから、引数を越えない値を検出
	2.近似値を算出する
 **********************************************************************
*/
function getLatlng(lat_lng_dis, dis_meter)
{
	var lat = 0;
	var lng = 1;
	var dis = 2;
	
	var ret = [0.0,0.0,0.0]; // 緯度、経度、距離を返す

	// スタート地点を返す
	if( lat_lng_dis[0][2] > dis_meter ){
		return lat_lng_dis[0];
	}

	// 終了地点を返す
	if( lat_lng_dis[lat_lng_dis.length-1][2] < dis_meter ){
		return lat_lng_dis[lat_lng_dis.length-1];
	}

	// ----------------------------------------
	// Step1
	// リストから最も近い緯度経度を検出する
	// ----------------------------------------
	for( var i=1 ; i<lat_lng_dis.length ; i++){
		var d = lat_lng_dis[i];

		// 距離ゼロの定義が必要★
		if( d[dis] > dis_meter ){

			ret = approximateLatlng(
				lat_lng_dis[i-1],
				lat_lng_dis[i],
				dis_meter);
			return ret;
		}
	}
	// ここまで到達することはないはず
	// 終了地点を返す
	return [0,0,0];//lat_lng_dis[lat_lng_dis.length-1];
}
