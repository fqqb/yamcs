#!/bin/bash
set -e

# This script generates releases in two steps:
# 1. Compile a fresh clone of the development tree
# 2. Emit artifacts (yamcs, yamcs-simulation, yamcs-client) in various formats.
#
# By design (2) does not require any sort of compilation.
#
# Official releases should be done from a Debian-based machine because of use
# of dpkg-deb.

buildweb=1
builddeb=1
GPG_KEY=yamcs@spaceapplications.com

for arg in "$@"; do
    case "$arg" in
    --no-web)
        buildweb=0
        ;;
    --no-deb)
        builddeb=0
        ;;
    *)
        echo "Usage: $0 [--no-web] [--no-deb]"
        exit 1;
        ;;
    esac
done

cd `dirname $0`
yamcshome=`pwd`

if [[ -n $(git status -s) ]]; then
    read -p 'Your workspace contains dirty or untracked files. These will not be part of your release. Continue? [Y/n] ' yesNo
    if [[ -n $yesNo ]] && [[ $yesNo == 'n' ]]; then
        exit 0
    fi
fi

pomversion=`mvn -q help:evaluate -Dexpression=project.version -DforceStdout`

if [[ $pomversion == *-SNAPSHOT ]]; then
    snapshot=1
    d=`date +%Y%m%d%H%M%S`
    version=${pomversion/-SNAPSHOT/}
    release=SNAPSHOT$d
else
    snapshot=0
    version=$pomversion
    release=1  # Incremental release number for a specific version
fi

if [ $snapshot -eq 0 ]; then
    # This will pop-up a prompt to interactively set the version number
    mvn versions:set versions:commit

    if [[ -n $(git status -s) ]]; then
        git commit `find . -name pom.xml -maxdepth 3` -m"Prepare release yamcs-${version}"
    fi

    git tag yamcs-$version
fi

mvn -q clean

clonedir=$yamcshome/distribution/target/yamcs-clone

mkdir -p $clonedir
git clone . $clonedir
rm -rf $clonedir/.git

cd $clonedir

if [ $buildweb -eq 1 ]; then
    cd yamcs-web
    yarn install --network-timeout 100000
    yarn build
    rm -rf `find . -maxdepth 3 -name node_modules`
    cd ..
fi

mvn package -P yamcs-release -DskipTests

rpmtopdir="$yamcshome/distribution/target/rpmbuild"
mkdir -p $rpmtopdir/{RPMS,BUILD,SPECS,tmp}

debtopdir="$yamcshome/distribution/target/debbuild"
mkdir -p $debtopdir

# Build Yamcs RPM
cp distribution/target/yamcs-$pomversion.tar.gz $yamcshome/distribution/target

rpmbuilddir="$rpmtopdir/BUILD/yamcs-$version-$release"

mkdir -p "$rpmbuilddir/opt/yamcs"
tar -xzf distribution/target/yamcs-$pomversion.tar.gz --strip-components=1 -C "$rpmbuilddir/opt/yamcs"

mkdir -p "$rpmbuilddir/etc/init.d"
cp -a distribution/sysvinit/* "$rpmbuilddir/etc/init.d"
cat distribution/rpm/yamcs.spec | sed -e "s/@@VERSION@@/$version/" | sed -e "s/@@RELEASE@@/$release/" > $rpmtopdir/SPECS/yamcs.spec

rpmbuild --define="_topdir $rpmtopdir" -bb "$rpmtopdir/SPECS/yamcs.spec"

# Simulation Example RPM
cp -r $clonedir "$rpmtopdir/BUILD/yamcs-simulation-$version-$release"
cat distribution/rpm/yamcs-simulation.spec | sed -e "s/@@VERSION@@/$version/" | sed -e "s/@@RELEASE@@/$release/" > $rpmtopdir/SPECS/yamcs-simulation.spec
rpmbuild --define="_topdir $rpmtopdir" -bb "$rpmtopdir/SPECS/yamcs-simulation.spec"

# Legacy Yamcs Client RPM
cp distribution/target/yamcs-client-$pomversion.tar.gz $yamcshome/distribution/target
rpmbuilddir="$rpmtopdir/BUILD/yamcs-client-$version-$release"
mkdir -p "$rpmbuilddir/opt/yamcs-client"
tar -xzf distribution/target/yamcs-client-$pomversion.tar.gz --strip-components=1 -C "$rpmbuilddir/opt/yamcs-client"
cat distribution/rpm/yamcs-client.spec | sed -e "s/@@VERSION@@/$version/" | sed -e "s/@@RELEASE@@/$release/" > $rpmtopdir/SPECS/yamcs-client.spec
rpmbuild --define="_topdir $rpmtopdir" -bb "$rpmtopdir/SPECS/yamcs-client.spec"

cd "$yamcshome"
mv distribution/target/rpmbuild/RPMS/noarch/* distribution/target/

if [ $snapshot -eq 0 ]; then
    rpmsign --key-id $GPG_KEY --addsign distribution/target/*.rpm
fi

# Yamcs Debian package (experimental)
if [ $builddeb -eq 1 ]; then
    debbuilddir=$debtopdir/yamcs
    
    mkdir -p $debbuilddir/opt/yamcs
    tar -xzf distribution/target/yamcs-$pomversion.tar.gz --strip-components=1 -C "$debbuilddir/opt/yamcs"
    
    mkdir -p "$debbuilddir/etc/init.d"
    cp -a distribution/sysvinit/* "$debbuilddir/etc/init.d"
    
    mkdir $debbuilddir/DEBIAN
    cp distribution/debian/yamcs/* $debbuilddir/DEBIAN
    installedsize=`du -sk $debbuilddir | awk '{print $1;}'`
    cat distribution/debian/yamcs/control | sed -e "s/@@VERSION@@/$version/" | sed -e "s/@@RELEASE@@/$release/" | sed -e "s/@@INSTALLEDSIZE@@/$installedsize/" > "$debbuilddir/DEBIAN/control"
    
    fakeroot dpkg-deb --build $debbuilddir
    # dpkg-deb always writes the deb file in '..' of the builddir
    mv $debtopdir/*.deb "$yamcshome/distribution/target/yamcs_$version"-"$release"_amd64.deb

    if [ $snapshot -eq 0 ]; then
        debsigs --sign=origin --default-key $GPG_KEY distribution/target/*.deb
    fi
fi

echo
echo 'All done. Generated assets:'
ls -lh `find distribution/target -maxdepth 1 -type f`
echo

if [ $snapshot -eq 0 ]; then
    read -p "Do you want to stage $pomversion maven artifacts to Maven Central? [y/N] " yesNo
    if [[ $yesNo == 'y' ]]; then
        mvn -f $clonedir -P yamcs-release -DskipTests deploy
        echo 'Release the staging repository at https://oss.sonatype.org'
    fi
else
    read -p "Do you want to publish $pomversion maven artifacts to Sonatype Snapshots? [y/N] " yesNo
    if [[ $yesNo == 'y' ]]; then
        mvn -f $clonedir -P yamcs-release -DskipTests -DskipStaging deploy
    fi
fi

rm -rf $clonedir $rpmtopdir $debtopdir

# Upgrade version in pom.xml files
# For example: 1.2.3 --> 1.2.4-SNAPSHOT
if [ $snapshot -eq 0 ]; then
    if [[ $version =~ ([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
        developmentVersion=${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.$((BASH_REMATCH[3] + 1))-SNAPSHOT
        mvn versions:set -DnewVersion=$developmentVersion versions:commit
        git commit `find . -name pom.xml -maxdepth 3` -m"Prepare next development iteration"
    else
        echo 'Failed to set development version'
        exit 1
    fi
fi

