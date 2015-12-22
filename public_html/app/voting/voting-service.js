(function () {
    angular.module("votingApp").service("VotingService", ["$cookies", "$firebaseArray",
        function ($cookies, $firebaseArray) {
            var votingService = this,
                    firebaseReference = new Firebase("https://365-vote.firebaseio.com/votingItems"),
                    votingItems = $firebaseArray(firebaseReference),
                    cookieName = "mk-365-vote";
            this.hasVoted = function () {
                return votingService.getVote() !== undefined;
            };
            this.undoVote = function () {
                $cookies.put(cookieName, undefined);
            };
            this.voteFor = function (item) {
                if (votingService.hasVoted()) {
                    return;
                }
                $cookies.put(cookieName, JSON.stringify(item));
            };
            this.getVote = function () {
                return $cookies.getObject(cookieName);
            };
            this.getVotingItems = function () {
                return votingItems.$loaded();
            };

        }
    ]);
})();