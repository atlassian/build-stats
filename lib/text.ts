export default {
  mainText: {
    help: `
    	Usage
        $ build-stats <service>:<user>/<repo> <command> [...opts]

    	Commands
        cache            Outputs the directory where data will be cached
        calculate        Calculate average build time and success rates over time
        clean            Delete the downloaded history of repository
        download         Download history for a repository
        history          List individual builds
        success          Get quick stats of number of success and failed builds

    	Options
        --auth        [authentication]  (download)  Authentication to access private repo
        --branch      [name]            (calculate/history) Which branch(es) to display (Comma-separated list) (Default: *)
        --concurrency [number]          (download)  How many parallel downloads should be used when downloading data (Default: 10)
        --last        [count]           (calculate) How many periods to calculate back to (Default: 30)
        --period      [days]            (calculate) How many days in a time period to calculate the means for (Default: 1)
        --result      [name]            (calculate/history) Which branch(es) to display (Comma-separated list) (Default: *)
        --since       [buildNumber]     (download)  Overrides the normal logic of which builds to download data for.
                                                    This should only be required in debugging/fixing errors (Default: last downloaded build)
        --threshold   [time]            (calculate) Time under which builds graph is shown in green color. Default is mean of all the builds in that period

    	Services
        - bitbucket      Bitbucket Pipelines
        - travis         Travis CI

    	Examples
        Download travis builds history to .data folder:
        $ build-stats travis:boltpkg/bolt download

        Download travis builds history to .data folder for private repository:
        $ build-stats travis:boltpkg/bolt download --auth <token>

        Download a subset of builds very quickly:
        $ build-stats travis:boltpkg/bolt download --concurrency=20 --since=300

        Calculate monthly average build time and success rate of a repo over the last year
        $ build-stats travis:boltpkg/bolt calculate

        Calculate daily average build time and success rate of a repo over the last month
        $ build-stats travis:boltpkg/bolt calculate --period 1 --last 30

        Calculate daily average build time and success rate of the master branch of a repo over the last 90 days
        $ build-stats travis:boltpkg/bolt calculate --branch master --period 1 --last 90

        Display build history
        $ build-stats travis:boltpkg/bolt history

        Display build history for master branch for builds that were either successful or failed
        $ build-stats travis:boltpkg/bolt history --branch master --result SUCCESSFUL,FAILED

        Display the number of success and failed builds
        $ build-stats travis:boltpkg/bolt success

        Delete the downloaded history of repository
        $ build-stats travis:boltpkg/bolt clean

        Output the cache directory of a repository
        $ build-stats travis:boltpkg/bolt cache
        `,
  },
};
