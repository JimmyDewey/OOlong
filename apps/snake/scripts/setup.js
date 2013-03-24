/**
 * @author Dewey
 */

$(document).ready(function() {
	var snakey = $("#snakey")
	snakey.snakey({
		dimensions : {
			vertical : 30,
			horizontal : 30
		},
		pointSize : 12,
		style : {
			headColor : "#8080c0;",
			tailColor : "#8000ff",
			targetColor : "#f2dd74"
		},
		onGameOver : function() {
			snakey.snakey('init');
			alert("Game Over!");
		}
	});
	$('#btnstart').click(function() {
		snakey.snakey('start');
	});
});
