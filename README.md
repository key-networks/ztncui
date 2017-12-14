# ztncui - ZeroTier network controller UI

ztncui is a web UI for a standalone [ZeroTier](https://zerotier.com) network controller.

## Getting Started

### Prerequisites
* ztncui is a [node.js](https://nodejs.org) [Express](https://expressjs.com) application that requires [node.js](https://nodejs.org) v8 or higher.

* ztncui uses argon2 for password hashing. Argon2 needs the following:
  1. g++
  2. node-gyp, which can be installed with:
```shell
sudo npm install -g node-gyp
```

* ztncui requires [ZeroTier One](https://www.zerotier.com/download.shtml) to be installed on the same machine.  This will run as the network controller to establish ZeroTier networks.

* ztncui has been developed on a Linux platform and expects the ZT home directory to be in `/var/lib/zerotier-one`.  It should be easy to modify for other platforms - please feed back if this is required.

### Installing
##### 1. Clone the repository on a machine running ZeroTier One:
```shell
git clone https://github.com/key-networks/ztncui
```

##### 2. Install the [node.js](https://nodejs.org) packages:
```shell
cd ztncui
npm install
```

##### 3. Allow access to /var/lib/zerotier-one/authtoken.secret
The user running the ztncui app needs read access to authtoken.secret.  This can be achieved with:
```shell
sudo usermod -aG zerotier-one username
sudo chmod g+r /var/lib/zerotier-one/authtoken.secret
```
Where:
* username is the user running the ztncui app

Note that you need to log out and in again to apply the new group membership.

##### 4. Copy the default passwd file
To prevent git from over-writing your password file every time you pull updates from the repository, the etc/passwd file has been added to .gitignore.  So you need to copy the default file after the first time you do a git clone.  All these things ideally need to be done with a package installer script:
```shell
cp -v etc/default.passwd etc/passwd
```

##### 5. Start the app manually:
```shell
npm start
```
This will run the app on TCP port 3000 by default.  If port 3000 is already in use, you can specify a different port, e.g.:
```shell
PORT=3456 npm start
```

##### 6. Start the app automatically
To start the app automatically, something like [PM2](http://pm2.keymetrics.io) can be used.  Install it with:
```shell
sudo npm install -g pm2
```

Add ztncui as a managed app with:
```shell
pm2 start bin/www --name ztncui
```

To detect the init system:
```shell
pm2 startup
```

PM2 will then give you a command to execute to configure pm2 startup for your system.

##### 7. Test access on http://localhost:3000
  If the machine has a GUI and GUI web browser, then use it to access the app, otherwise use a text web browser like Lynx or a CLI web browser like curl:
```shell
curl http://localhost:3000
```
You should see the front page of the app (or the raw HTML with curl).

##### 8. Remote access:
For security reasons (until this app is battle-hardened and has been scrutinized by the ZT community), it currently listens only on the looback interface.  It can be reverse proxied by something like Nginx, but it would be best to access over an SSH tunnel at this stage.

###### SSH tunnel from Linux / Unix / macOS client
An SSH tunnel can be established with:
```shell
ssh -f user@network.controller.machine -L 3333:localhost:3000 -N
```
where:
* **network.controller.machine** is the FQDN of the machine running the ZT network controller and ztncui, and
* **user** is any user account that you have on that machine.

Once the SSH tunnel has been established, access the ztncui web interface in a web browser on your local machine at: http://localhost:3333

###### SSH tunnel from a Windows machine
On Windows you can install [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)

Open PuTTY and configure as follows:

1. Go to Connection -> SSH -> Tunnels.
2. Set **Source port** to 3333
3. Set **Destination** to localhost:3000
4. Click on the **Add** button.
5. Go to **Session** in the **Category** panel on the left.
6. Set **Host Name (or IP address)** to the FQDN of the machine running the ZT network controller and ztncui.
7. Enter a name for the configuration in **Saved Sessions** and click **Save**.
8. Click the **Open** button and log into the network controller machine.

Once the SSH tunnel has been established, access the ztncui web interface in a web browser on your local machine at: http://localhost:3333

## Usage
### User accounts
Once you have access to the web UI of ztncui, log in as user **admin** with password **password**.

You will be prompted to change the default password.

It's a good idea to create your own username and delete the default admin account.  You can do this by clicking on the **Users** tab and then the **Create user** tab.  Note that you then have to log out and log in as the new user before you can delete the default admin account.

### Networks
Click on the **Home** tab to get to the network controller home page.  From there you can click on the **Networks** tab to see the existing networks configured on the network controller (probably none if you have just set it up).

#### Create a new network
Click on the **Add network** tab to create a new ZeroTier network that is controlled by the network controller.  Give it a name and click **Create Network**.  You will then be taken back to the **Networks** page that lists all the networks on the controller.

#### Delete a network
On the **Networks** page, click the trash can icon to delete a network.  You will be warned that this action cannot be undone.  Click the **Delete** button to confirm the action.

#### Change network name
On the **Networks** page, click the name of the network to rename it.

#### Easy network setup
On the **Networks** page, click **easy setup** for the network that you want to auto-configure.  Click **Generate network address** to assign a random network address, or manually enter the network address in CIDR notation.  The start and end of the IP assignment pool will be automatically calculated, but these can be manually adjusted.  Click **Submit** to apply the configuration.  You should then get a notice that the network setup succeeded.

Note that the **easy setup** only works for IPv4 at this stage.  To set up IPv6, follow the **detail** link for a network from the **Networks** page and set up each property manually.

#### Join devices to the network
Invite users to join the network with:
```shell
sudo zerotier-cli join ################
```
where ################ is the 16-digit ZeroTier network ID.

Get the user to send you their 10-digit ZeroTier address, which they can get by running:
```shell
sudo zerotier-cli status
```

#### Authorize members on the network
On the **Networks** page, click **members** to see the devices which are trying to join the network.  Use the ZeroTier address given to you by the user to identify them and name them appropriately under **Member name**.

Then check the **Authorized** checkbox to authorize the user on the network.

If the user's device is online and you click the **Refresh** button, you should see their IP assignment being populated.

Once two or more members are authorized on the network, they should be able to connect to each other via their assigned IP addresses.

#### Network detail
On the **Networks** page, click **detail** to see the detail of a network.

Note that certain properties can be set by clicking on them - e.g.:
* ipAssignmentPools
* name
* routes
* v4AssignMode
* v6AssignMode

Note that editing of certain properties, such as rules and tags, has not been implemented yet.  Please feed back on your requirements.

#### Member detail
On the network **detail** page and on the **members** page, if you click on the member ID, you will end up on the member detail page.

Certain properties for the member can be set by clicking on them - e.g.:
* authorized
* umm... nothing else at this stage - let us know what you need.

## Feedback
Please give us your feedback... good, bad or ugly.  Constructive criticism is welcomed.  Please use the contact form at [key-networks.com](https://key-networks.com/) - Thanks :)

## License
The ztncui code is open source code, licensed under the GNU GPLv3, and is free to use on those terms. If you are interested in commercial licensing, please contact us via the contact form at [key-networks.com](https://key-networks.com) .
