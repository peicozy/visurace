// 2011/11/24 13:13 
//var Result = {
var RSLT = {
	_r_time : 0,   // 経過時間(秒)
	_r_data : [],  // 全選手配列
	_r_length : 0, // 全選手数
	_r_lap_distance : [], // ラップごとの距離
	_r_total_distance : 0, // 総距離
	_r_calc_mode : 0,// 1:ネットタイム 0:グロスタイム
	_r_data_cur : -1,// 注目選手（配列番号)
	_r_time_limit:13.5,// タイムリミット(時間)
	/*
	 **********************************************************************
	 * 表示選手を指定する
	 * 2011/12/16 14:04
	 **********************************************************************
	 */
	setbib : function(n){
		for(var i=0 ; i< this._r_length ; i++){
			if(this._r_data[i].correct == 0){
				continue;
			}
			// 一致した場合配列番号を格納
			if(this._r_data[i].no == n){
				this._r_data_cur = i;
//				alert(this._r_data_cur);
				return;
			}
		}
		// 見つからなかった場合
		//_r_data_cur = -1;
	},
	/*
	 **********************************************************************
	 * 時刻文字列から秒に換算する
	 * 2011/11/23 0:44
	 **********************************************************************
	 */
	str2sec : function(time_str){
		var t = time_str.split(":");
		
		if(t.length < 3){
			return 0;
		}
		
		var sec = parseInt(t[0],10) * 3600 +
			 parseInt(t[1],10) * 60 + 
			 parseInt(t[2],10);
		return sec;
	},
	/*
	 **********************************************************************
	 * 配列からオブジェクトを生成する
	 * 2011/11/23 0:35
	 * 2011/11/25 12:30 ラップタイムが揃っていないものは除く
	 * 2011/11/30 18:18 subXを追加
	 **********************************************************************
	 */
	ary2obj : function(ary)
	{
		var r = {};
		r.no = ary[0];
		r.rslt = ary[1];
		r.name = ary[2];
		r.cat = ary[3];
		r.grs = this.str2sec(ary[4]);  // グロスタイム
		r.net = this.str2sec(ary[5]);  // ネットタイム
		r.btime = ary[6];         // スタートまでの経過秒
		r.correct = 1;            // データ不備なし

		var t = new Array();
		var cnt = 0;
		for(var i=7 ; i<ary.length ; i++){
			t[cnt] = this.str2sec(ary[i]);
			if(t[cnt] == 0){
				r.correct = 0;// データ不備あり
			}
			cnt++;
		}
		r.lap = t; // ラップタイム
		r.subx = this.get_subX(r.grs); // サブ3.5などの数値
		return r;
	},
	/*
	 **********************************************************************
	 * 配列からオブジェクトを生成する2
	 * 2011/11/28 13:52 
	 * [17967,藤井沙耶花,女子総合,04:33:15,483,2:10:00,2:15:12],
	 *  0     1          2        3        4     5       6
	 *  番号  名前       カテゴリ グロス   待機  中間    フィニッシュ
	 **********************************************************************
	 */
	ary2obj2 : function(ary)
	{
		var r = {};
		r.no = ary[0];
		//r.rslt = ary[1];
		r.name = ary[1];
		r.cat = ary[2];
		r.grs = this.str2sec(ary[3]);  // グロスタイム
		//r.net = this.str2sec(ary[5]);  // ネットタイム
		r.btime = ary[4];         // スタートまでの経過秒
		r.correct = 1;            // データ不備なし

		var t = new Array();
		var cnt = 0;
		for(var i=5 ; i<ary.length ; i++){
			t[cnt] = this.str2sec(ary[i]);
			if(t[cnt] == 0){
				r.correct = 0;// データ不備あり
			}
			cnt++;
		}
		r.lap = t; // ラップタイム
		r.subx = this.get_subX(r.grs); // サブ3.5などの数値
		return r;
	},
	/*
	 **********************************************************************
	 * 配列からオブジェクトを生成する3
	 * 2012/01/20 21:52
	 * ["1","Wolfgang Guembel","8:10:39","0:35:4","4:7:16","3:28:19", "0:35:4","0:2:34","0:44:25","1:0:56","1:31:57","0:47:24","1:31:33","0:44:17","0:33:6","0:39:23"],
	 *  0     1                 2         3        4        5          6
	 *  番号  名前              総合      スイム　 バイク　 ラン       
	 **********************************************************************
	 */
	ary2obj3 : function(ary)
	{
		var r = {};
		r.no = ary[0];
		//r.rslt = ary[1];
		r.name = ary[1];
		//r.cat = ary[2];
		r.grs = this.str2sec(ary[2]);  // グロスタイム
		//r.net = this.str2sec(ary[5]);  // ネットタイム
		r.btime = 0;         // スタートまでの経過秒
		r.correct = 1;            // データ不備なし

		var t = new Array();
		var cnt = 0;
		for(var i=6 ; i<ary.length ; i++){
			t[cnt] = this.str2sec(ary[i]);
			if(t[cnt] == 0){
				r.correct = 0;// データ不備あり
			}
			cnt++;
		}
		r.lap = t; // ラップタイム
		r.subx = this.get_subX3(r.grs); // サブ3.5などの数値
		return r;
	},
	/*
	 **********************************************************************
	 * 経過時間をセットする
	 * 2011/11/22 23:06
	 **********************************************************************
	 */
	set_clock : function(sec)
	{
		this._r_time = sec
	},
	/*
	 **********************************************************************
	 * 現在の大会時刻で各選手の位置をアップデートする
	 * 2011/11/22 23:09
	 * 2011/11/29 13:07 top lastの更新処理が誤っていたのを修正
	 **********************************************************************
	 */
	update_result : function()
	{
		var top = 0;
		var last = this._r_total_distance;
		for(var i=0 ; i<this._r_length ; i++){
			// 正規データのみ対象
			if(this._r_data[i].correct == 0){
				continue;
			}
			// デフォルトを代入し
			// 個別距離の指定があれば利用
			var dis = this._r_lap_distance;
			if(this._r_data[i].lap_distance){
				dis = this._r_data[i].lap_distance;
			}
			// スタートまでの時間を考慮するか
			var before_time = 0;
			if( this._r_calc_mode == 0){
				before_time = this._r_data[i].btime;
			}
			// 距離計算
			var d = 
				this.calc_distance_lap(
				this._r_time,         // race_time,
				this._r_data[i].lap,  // lap_time,
				dis,                  // lap_distance
				before_time           // before_start
				);
			this._r_data[i].cur_dis = d;
			if(d > top){
				top = d;
			}
			if(d < last){
				last = d;
			}
		}
		this._r_top_dis = top;
		this._r_last_dis = last;
	},
	/*
	 **********************************************************************
	 * 現在の大会時刻の選手名配列を取得する
	 * 2011/11/22 23:23 0～(levels-1)個の配列に収める
	 * 2011/11/24 23:17 データ側にレベル(タグ)を打つ
	 **********************************************************************
	 */
	get_histgram : function(levels)
	{
		// width分配列用意し位置ごとの選手数を積算後
		var lines = new Array();
		for(var i=0 ; i<levels ; i++){
			lines[i] = 0;
		}
		for(var i=0 ; i< this._r_length ; i++){
			if(this._r_data[i].correct == 0){
				continue;
			}
			var d = this._r_data[i].cur_dis;
			var l = levels * (d / this._r_total_distance);
			l = Math.floor(l);
			if(l == levels){
				l = levels-1;
			}
			lines[l] += 1;
			this._r_data[i].tag = l;
		}
		return lines;
	},
	/*
	 **********************************************************************
	 * フィニッシュ（秒）を渡してサブXを返す
	 * 2011/11/28 18:24
	 **********************************************************************
	 */
	get_subX : function(t)
	{
		var s = t/3600;
		if     (s < 2.5)return 0;
		else if(s < 3.0)return 1;
		else if(s < 3.5)return 2;
		else if(s < 4.0)return 3;
		else if(s < 4.5)return 4;
		else if(s < 5.0)return 5;
		                return 6;
	},
	get_subX3 : function(t)
	{
		var s = t/3600;
		if     (s < 7.0)return 0;
		else if(s < 8.0)return 1;
		else if(s < 9.0)return 2;
		else if(s < 10.0)return 3;
		else if(s < 11.0)return 4;
		else if(s < 12.0)return 5;
		                return 6;
	},
	/*
	 **********************************************************************
	 * 現在の大会時刻の選手名配列とサブX(30分単位)を取得する
	 * 2011/11/28 18:07
	 **********************************************************************
	 */
	get_histgram2 : function(levels)
	{
		// width分配列用意し位置ごとの選手数を積算後
		var lines = new Array();
		for(var i=0 ; i<levels ; i++){
			lines[i] = {};
			lines[i].t = 0;
//			lines[i].s = new Array();
			lines[i].s = [0,0,0,0,0,0,0];
		}
		for(var i=0 ; i< this._r_length ; i++){
			if(this._r_data[i].correct == 0){
				continue;
			}
			var d = this._r_data[i].cur_dis;
			var l = levels * (d / this._r_total_distance);
			l = Math.floor(l);
			if(l == levels){
				l = levels-1;
			}
			lines[l].t += 1;
			this._r_data[i].tag = l;
			lines[l].s[this._r_data[i].subx] += 1;
		}
		return lines;
	},
	/*
	 **********************************************************************
	 * ヒストグラム生成時にセットしたレベルの選手データを取得する
	 * 2011/11/24 23:21
	 **********************************************************************
	 */
	get_histgram_data : function(level)
	{
		var cnt = 0;
		var d = new Array();
		for(var i=0 ; i< this._r_length ; i++){
			if(this._r_data[i].tag == level){
				d[cnt] = this._r_data[i];
				cnt++;
			}
		}
		return d;
	},
	/*
	 **********************************************************************
	 * 現在の大会時刻の選手名配列を取得する
	 * 2011/11/22 23:49 指定範囲を指定レベルにわけヒストグラムを得る
	 * 2011/11/24 12:43 配列添え字を整数化
	 * 2011/11/24 12:46 ヒストグラム化の計算式を変更し最上位に範囲化
	 * 2011/11/29 13:20 スタートエンドの範囲内チェックの不等号逆向きを修正
	 * 2011/11/29 13:37 スタートエンドの距離が逆
	 **********************************************************************
	 */
	get_histgram_zoom : function(levels,start,end)
	{
		// width分配列用意し位置ごとの選手数を積算後
		var lines = new Array();
		for(var i=0 ; i<levels ; i++){
			lines[i] = 0;
		}
		// スタートからエンドまでの距離
		var dis = start - end;
		for(var i=0 ; i<this._r_length ; i++){
			var d = this._r_data[i].cur_dis;
			// 選手が範囲内にいるか
			if( d <= start && d >= end){
				var l = levels * (d - end) / dis;
				l = Math.floor(l);
				if(l == levels){
					l = levels-1;// ぴったりのものをどうするか
				}
				lines[l] += 1;
			}
		}
		return lines;
	},
	/*
	 **********************************************************************
	 * 現在の大会時刻の選手名配列を取得する
	 * 2011/12/01 9:33 [レベルの人数、配列番号,,,,]
	 **********************************************************************
	 */
	get_histgram_zoom2 : function(levels,start,end)
	{
		// width分配列用意し位置ごとの選手数を積算後
		var lines = new Array();
		for(var i=0 ; i<levels ; i++){
			lines[i] = {};
			lines[i].t = 0;
			lines[i].s = [];
		}
		// スタートからエンドまでの距離
		var dis = start - end;
		for(var i=0 ; i<this._r_length ; i++){
			if(this._r_data[i].correct == 0){
				continue;
			}
			var d = this._r_data[i].cur_dis;
			// 選手が範囲内にいるか
			if( d <= start && d >= end){
				var l = levels * ((d - end) / dis);
				l = Math.floor(l);
				if(l == levels){
					l = levels-1;// ぴったりのものをどうするか
				}
				lines[l].s[lines[l].t] = i;// 配列番号を追加
				lines[l].t += 1;// このレベルの総数を追加
			}
		}
		return lines;
	},
	/*
	 **********************************************************************
	 * トップ選手の現在位置を取得
	 * 2011/11/22 23:58
	 **********************************************************************
	 */
	get_top : function()
	{
		return this._r_top_dis;
	},
	/*
	 **********************************************************************
	 * ラスト選手の現在位置を取得
	 * 2011/11/22 23:58
	 **********************************************************************
	 */
	get_last : function()
	{
		return this._r_last_dis;
	},
	/*
	 **********************************************************************
	 * 区間距離配列を取得するdis
	 * 2011/11/23 0:00
	 **********************************************************************
	 */
	get_lap_dis : function()
	{
		return this._r_lap_distance;
	},
	/*
	 **********************************************************************
	 * 時刻から秒に変換
	 * 2011/11/15 9:57 JSON or JavaScriptの一関数として定義できるのでは？
	 **********************************************************************
	 */
	time2hour : function(h,m,s)
	{
		var t = h * 3600 + m * 60 + s;
		return t;
	},
	/*
	 **********************************************************************
	 * 秒から時刻文字列に変換
	 * 2011/12/19 10:26
	 **********************************************************************
	 */
	clock2str : function(time_value)
	{
		var hh = Math.floor(time_value / 3600);
		var mm = Math.floor((time_value - (hh * 3600)) / 60);
		var ss = Math.floor(time_value - hh*3600 - mm*60);
/*

		// 2.5 を 02:30:00の文字列に変換する
		var hh = Math.floor(time_value);
		// 秒数を求める
		var sec = Math.floor( (time_value - hh) / (1.0 / 3600) );
		// 分
		var mm = Math.floor( sec / 60 );
		// 秒
		var ss = sec - (mm * 60);
*/
		if(hh < 10)hh = "0" + hh;
		if(mm < 10)mm = "0" + mm;
		if(ss < 10)ss = "0" + ss;
		
		return hh + ":" + mm + ":" + ss;
	},
	/*
	 **********************************************************************
	 * 経過秒から距離mを算出する
	 *
	 * race_time レース時刻(経過秒)
	 * lap_time[] 各パートのラップタイム(配列）
	 * lap_distance[] 各パートの距離（配列）
	 *
	 * 2011/11/07 9:49
	 * 2011/11/11 9:48 単位変更
	 *                 race_time 時->秒 lap_time 時->秒 lap_distance km->m
	 * 2011/11/22 22:52 lap_time がゼロ、つまり途中棄権の場合を考慮する
	 * 2011/11/25 12:44 スタートまでの時間(秒)を考慮
	 **********************************************************************
	 */
	calc_distance_lap : function(race_time, lap_time, lap_distance, before_start)
	{
		if( race_time <= before_start ){
			return 0;// まだスタートしていない
		}
		race_time -= before_start;
		/*
		 ****************************************************
		 * Step1 lap区間を検出
		 ****************************************************
		 */
		var len = lap_time.length;
		var total_time = 0;// 総時間
		var cur_lap = 0;// どの区間に居るか？
		var i = 0;
		for(i = 0 ; i < len ; i++){
			total_time += lap_time[i];
			if(race_time < total_time){
				break;
			}
		}
		cur_lap = i;
		/*
		 ****************************************************
		 * Step2 距離を算出
		 ****************************************************
		 */
		var total_distance = 0;
		var left_time = race_time;
		for(var i = 0 ; i < cur_lap ; i++){
			total_distance += lap_distance[i];
			left_time -= lap_time[i];
		}
		// すでにゴールしている場合
		if(cur_lap == len){
			return total_distance;
		}
		// 途中棄権の場合
		if(lap_time[cur_lap] == 0){
			return total_distance;
		}
		// 
		if(race_time >= 0){
			// この区間の秒速 m/s を求める
			var meter_per_second = 
				lap_distance[cur_lap] / lap_time[cur_lap];
			// 距離を求める
			var dis = left_time * meter_per_second;
			return (total_distance + dis);
		}
		/*
		 ****************************************************
		 * エラーの場合
		 ****************************************************
		 */
		alert("calc_distance_lap error");
		alert(race_time);
		alert(lap_time);
		alert(lap_distance);
	},
	/*
	 **********************************************************************
	 * 時刻配列から秒に変換する
	 **********************************************************************
	 */
	cnv_result_hour2sec : function(lap_hour)
	{
		// lap_hour = [ [1,1,1],[2,2,2],[3,3,3] ]
		// lap_second = [3661, 7201, 10983]

		var lap_second = new Array();
		for(var i=0 ; i<lap_hour.length ; i++){
			lap_second[i] =
			lap_hour[i][0] * 3600 + 
			lap_hour[i][1] * 60 +
			lap_hour[i][2];
		}
		return lap_second;
	},
	/*
	 **********************************************************************
	 * リザルトに秒変換後のプロパティlap_s(配列)を追加する
	 *
	 * 2011/11/11 10:33
	 * 2011/11/15 9:34 プロパティ show を追加
	 * 2011/11/23 0:07 
	 **********************************************************************
	 */
	prepare_result : function()
	{
		for(var i=0 ; i<_r_length ; i++){
			var h = this._r_data[i].lap;
			var s = this.cnv_result_hour2sec(h);
			this._r_data[i].lap_s = s;
			this._r_data[i].show = 0;
		}
	},
	/*
	 **********************************************************************
	 * リザルトデータのセット(東京マラソン版リザルト)
	 * 2011/12/14 10:00
	 * 2012/11/15 11:11 最長のグロスタイムを_r_time_limitに格納
	 **********************************************************************
	 */
	set_result : function(result, laps, type)
	{
		this._r_length = result.length;
		// データの格納
		for(var i=0 ; i<result.length ; i++){
			if(type == 0){
				var o = this.ary2obj(result[i]);
			}
			if(type == 1){
				var o = this.ary2obj2(result[i]);
			}
			if(type == 3){
				var o = this.ary2obj3(result[i]);
			}

			this._r_data[i] = o;
		}
		// ラップの格納
		for(var i=0 ; i<laps.length ; i++){
			this._r_lap_distance[i] = laps[i];
			this._r_total_distance += laps[i];
		}
		
		// 最長のグロスタイムを	_r_time_limit に格納する
		var max = 0;
		for(var i=0 ; i<result.length ; i++){
			var t = this._r_data[i].grs;
			if( t > max){
				max = t;
			}
		}
		this._r_time_limit = max / 3600.0;// 時間に直す
		console.log(this._r_time_limit);
		//alert(this._r_time_limit);
	},
	// ====================================================================
	view_detail : {
	_ctx : {}, // canvasオブジェクト
	_w : 0, // 幅
	_h : 0, // 高さ
	_ary : {}, // 選手の位置情報オブジェクト
	_m : 0, // 描画の中心
	_top : 0, // 先頭
	_end : 0, // 末尾
	_unit : 10,
	/*
	 **********************************************************************
	 * 初期化
	 * 2011/12/13 13:20
	 **********************************************************************
	 */
	init : function(ctx, width, height){
		this._ctx = ctx;
		this._w = width;
		this._h = height;
	},
	/*
	 **********************************************************************
	 * 描画
	 * 2011/12/13 12:56
	 **********************************************************************
	 */
	draw : function(){
		this.draw_meter();
		this.draw_meter2();
	},
	/*
	 **********************************************************************
	 * 距離表示1 10メートル単位に表示する
	 * 2011/12/13 13:12
	 **********************************************************************
	 */
	draw_meter : function(){
		var unit = this._unit;
		// _endに最も近い 10m区切りは?
		var s = this._end + (unit - (this._end % unit));

		// unit m単位でラインを表示する
		for(var i=s ; i<this._top ; i+=unit){

			var l = this._w * ((i-this._end) / (this._top - this._end));
			l = Math.floor(l);

			this._ctx.beginPath();
			this._ctx.strokeStyle = "blue";
			this._ctx.lineWidth = 0.5;
			this._ctx.globalAlpha = 1.0;

			this._ctx.moveTo(l, 0);
			this._ctx.lineTo(l, 20);

//			this._ctx.moveTo(l, this._h-20);
//			this._ctx.lineTo(l, this._h);
			this._ctx.stroke();
			
			this._ctx.fillStyle  = "blue";
			var txt = (i).toString() + "m";
//			this._ctx.fillText(txt,l,this._h-1);
			this._ctx.fillText(txt,l+1,10);
		}
	},
	/*
	 **********************************************************************
	 * 距離表示2 中央に描画する
	 * 2011/12/13 13:12
	 * 2011/12/16 16:01 上部に表示するよう変更
	 **********************************************************************
	 */
	draw_meter2 : function(){
		// 中央は何メートルか？
		var center = Math.floor(this._end + (this._top-this._end)/2);
		var l = this._w/2;
		l = Math.floor(l);

		this._ctx.beginPath();
		this._ctx.strokeStyle = "red";
		this._ctx.lineWidth = 0.5;
		this._ctx.globalAlpha = 1.0;
		this._ctx.moveTo(l, 0);
		this._ctx.lineTo(l, 30);

//		this._ctx.moveTo(l, this._h-30);
//		this._ctx.lineTo(l, this._h);
		this._ctx.stroke();
		
		this._ctx.fillStyle  = "red";
		var txt = (center).toString() + "m";
//		this._ctx.fillText(txt,l+1,this._h-20);
		this._ctx.fillText(txt,l+1,10);
	}
	}

};

/*

	// 指定した単語が含まれるレコードを配列で返す最大1000件
	get_record(keys)
	// 指定選手のリザルトにマークをつける
	set_mark(no)
	unset_mark(no
	// 指定選手のリザルトマークをクリアする
	reset_mark();
	// マークがついた選手の結果を配列で返す最大1000件
	get_mark_athlete()
	// 大会情報を取得する
	get_comp_data
*/

