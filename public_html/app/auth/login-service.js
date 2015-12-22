(function () {
    var app = angular.module("votingApp");
    app.factory("LoginService", ["$firebaseAuth", function ($firebaseAuth) {
            var ref = new Firebase("https://365-vote.firebaseio.com");
            // create an instance of the authentication service
            return $firebaseAuth(ref);
        }]);
})();