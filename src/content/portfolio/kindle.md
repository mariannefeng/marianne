---
title: "repurpose your old Kindle"
description: "Hack an old kindle to display bus arrival times"
tags: [how-to, fun]
draft: true
githubUrl: "https://github.com/mariannefeng/kindle-hax"
pubDate: "Feb 20 2026"
---

# How to hack an old Kindle to display bus arrival times

<img src="https://assets.mariannefeng.com/portfolio/kindle/kindle-finished-product.jpg" alt="Kindle mounted to a wall displaying bus arrival times" class="three-quarters" />

This is how I turned an old Kindle (Kindle Touch 4th Generation/K5/KT) into a live bus feed that refreshes every minute with the option to exit out of dashboard mode by pressing the menu button. The high level steps are:

1. Jailbreak your kindle
2. Install KUAL & MRPI
3. Setup SSH
4. Run a server accessible over the internet (or your local network) that serves up a Kindle accepted image
5. Setup a way to continously retrieve the image on your Kindle

## 1. Jailbreaking your Kindle

This will be your [Kindle hacking bible](https://www.mobileread.com/forums/showthread.php?t=225030) for steps 1 - 3. The order of operations is to figure out what version of Kindle you have, its firmware version (shorthand FW in the Kindle forum guides + readmes), download the appropriate tar file and follow installation instructions.

Once you've successfully jailbroken your Kindle, it's time to install some things.

## 2. Installing KUAL & MRPI

KUAL is a custom Kindle app launcher. MRPI was necessary so that I can install custom apps onto the Kindle (you may not need MRPI if you have a newer Kindle). This part was very difficult for me, reading through the mobile forum threads gave me a headache. The most helpful resource I found was the [Kindle modding wiki](https://kindlemodding.org/jailbreaking/post-jailbreak/installing-kual-mrpi/). Maybe other people aren't as oblivious as me but it took me way too long to realize that the "next step" in each individual guide can be accessed by clicking the "Next Step" button at the bottom of the page.

<img src="https://assets.mariannefeng.com/portfolio/kindle/modding-wiki-next-step.png" alt="Kindle modding wiki next step button hiding in plain sight" class="full" />

Another gotcha was that I _had_ to follow the [Setting up a Hotfix guide](https://kindlemodding.org/jailbreaking/post-jailbreak/setting-up-a-hotfix/) _before_ attempting to install KUAL & MRPI. Otherwise, the KUAL/MRPI install would fail.

After successfully installing KUAL & MRPI, I also [Disabled OTA Updates](https://kindlemodding.org/jailbreaking/post-jailbreak/disable-ota.html) because why not. I stopped following the remaining steps after disabling OTA Updates because they didn't seem relevant to this project.

<img src="https://assets.mariannefeng.com/portfolio/kindle/things-are-happening.jpeg" alt="One of the screens from the KUAL Installation" class="less-than-half" />

<img src="https://assets.mariannefeng.com/portfolio/kindle/oh-you-got-jokes.jpeg" alt="Kindles are slow lol - A funny message that reassured me" class="less-than-half" />

## 3. Setup SSH for your Kindle

This can be done with a KUAL extension called USBNetwork (which you can also download from the [Kindle hacking bible](https://www.mobileread.com/forums/showthread.php?t=225030)) that will allow you to SSH onto your Kindle as if it were a regular server.

However, nowhere in the forums could I find any information about how to actually install a KUAL extension using MRPI. Finally, this helpful [blogpost on setting up SSH for Kindle](https://blog.znjoa.com/2023/07/26/installing-usbnetwork-on-kindle/) came to my rescue. I followed the step that explained to how to install the extension, and how to setup SSH via USB. I ignored the rest of the instructions on the page because I'm not concerned about adding a password to the Kindle or setting up SSH over wifi.

If you've setup SSH successfully, when the Kindle is plugged in, your computer's network tab should have a new item in 'Connected' mode:

<img src="https://assets.mariannefeng.com/portfolio/kindle/usbnetwork-disabled.png" alt="Your computer's network tab if SSH to the Kindle is disabled" class="less-than-half" />

<img src="https://assets.mariannefeng.com/portfolio/kindle/usbnetwork-enabled.png" alt="What your computer's network tab will look like once USB network is successfully enabled" class="less-than-half" />

Here's what my Kindle network settings looks:

<img src="https://assets.mariannefeng.com/portfolio/kindle/my-kindle-network-settings.png" alt="My Kindle's network settings" class="three-fourths" />

Congratulations! Your Kindle is now ready to run custom code.

## 4. Running a server that generates an image for the Kindle

How displaying custom data on the Kindle works is that we need to create a png that fits the Kindle resolution, then draw the image onto the Kindle itself.

Since I live in New Jersey, I wanted to display NJTransit bus times on my Kindle. Luckily, NJTransit has a public GraphQL server that returns bus arrival times for any stop number.

#### Pulling NJ Transit bus data

After poking around in the network tab of the [NJ Transit Bus Website](https://www.njtransit.com/bus-to), I found this GraphQL query that returns the bus number, arrival time, current capacity, destination, and departing time in minutes:

```
  query BusArrivalsByStopID($stopID: ID!) {
    getBusArrivalsByStopID(stopID: $stopID) {
      departingIn
      destination
      route
      time
      capacity
      __typename
    }
  }
```

If you're also a Jersey girl, you can run the following curl to get upcoming bus times (don't forget to replace YOUR_STOP_NUMBER):

```
curl 'https://www.njtransit.com/api/graphql/graphql' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'pragma: no-cache' \
  -H 'priority: u=1, i' \
  --data-raw $'{"operationName":"BusArrivalsByStopID","variables":{"stopID":"YOUR_STOP_NUMBER"},"query":"query BusArrivalsByStopID($stopID: ID\u0021) {\\n  getBusArrivalsByStopID(stopID: $stopID) {\\n    departingIn\\n    destination\\n    busID\\n    route\\n    time\\n    vehicleID\\n    capacity\\n    __typename\\n  }\\n}"}'
```

#### Creating a server

In the majority of the guides I read during this process (two most helpful being [Matt Healy's Kindle Dashboard guide](https://matthealy.com/kindle) and [Hemant's Kindle Dashboard guide](https://terminalbytes.com/reviving-kindle-paperwhite-7th-gen/)) they use puppeteer to convert HTML to png. This does not work for me because I'm cheap and have a single $6 Digital Ocean droplet that I use for all side projects. And every time I ran puppeteer on it the entire server would crap out. So instead I created an endpoint that formats the bus data into nice looking HTML, then the docker container that runs the server would run a cron that runs the [wkhtmltoimage](https://wkhtmltopdf.org/) command and generate a Kindle formatted png every 3 minutes using the HTML endpoint. The server then serves the generated file at a separate endpoint.

<img src="https://assets.mariannefeng.com/portfolio/kindle/kindle-server-endpoints.png" alt="Screenshot of terminal displaying 3 endpoints, at /, /screen, and /html" class="full" />

### TODO: SOMETHING HERE EXPLAINING THE ENDPOINTS OR SOMETHING?? (link to the endpoints themselves as examples)

The entire server code - Dockerfile, scripts, the server itself - can be found in the [`server` folder of my Kindle hax repo](https://github.com/mariannefeng/kindle-hax/tree/main/server)

The server is written in Node because I was originally using Puppeteer, but since I'm now no longer using Puppeteer, it may be a fun optimization exercise to rewrite in Go.

#### Generating the image

The most important thing is that the image needs to conform to your Kindle's screen resolution. You can find what yours is by running `eips -i`. This is also the command you'll be using to display an image on your Kindle. I found this [eips menu guide helpful](https://wiki.mobileread.com/wiki/Eips)

You'll see an output like this:

<img src="https://assets.mariannefeng.com/portfolio/kindle/eips-info-output.png" alt="Screenshot of terminal displaying the output of the eips -i command. The values xres, yres, and rotate are circled in red" class="three-fourths" />

My Kindle expects a 600x800 image and the image must be rotated. Without passing a rotate command during the image generation process, I got skewed image like this:

<img src="https://assets.mariannefeng.com/portfolio/kindle/skewed-image.jpeg" alt="An image of bus arrival times on a Kindle, but the image is horizontally aligned and skewed horizontally" class="less-than-half" />

<img src="https://assets.mariannefeng.com/portfolio/kindle/bad-rotation-image.jpeg" alt="An image of bus arrival times on a Kindle, but the image is horizontally aligned" class="less-than-half" />

However, after rotating, the bus times could only be viewed horizontally. I wanted to be able to mount my Kindle vertically. So what that meant was I had to rotate the actual HTML itself. But when rotating an image and then taking a snapshot, the rotation is around the center of the screen so that snapshot made by wkhtmltoimage kept on cutting off the bus times. Finally, a combination of rotate and translate gave me what I needed, which was a rotated image that was aligned to the top left of the screen:

`transform: rotate(90deg) translateX(-100px) translateY(-100px);`

Once you have a server with an endpoint that serves your image (mine's at https://kindle.mariannefeng.com/screen), you're now ready to run this on the Kindle.

## 5. Creating a KUAL dashboard extension

I want two things - the first was an easy way to exit dashboard mode, the second was for the bus times to refresh every minute. All the guides I've seen so far ran a cron on their Kindle that hit their endpoint at specified intervals. However I didn't want to do this because I didn't want the Kindle after every restart to run the dashboard. I wanted to control when the dashboard is displayed. That means having a dashboard extension.

The expected layout for a KUAL extension is:

```

# scripts
bin/
  /start.sh # initiated when the app is launched
  /stop.sh # automatically called when the menu button is pressed
config.xml # whatever I copy pasted this from an extension that worked
menu.json # controls the menu items in the KUAL dashboard

```

Whiled SSH-ed into your Kindle, place your custom extension folder inside of `/mnt/us/extensions/`. If you copy/pasted the linked custom-dash folder, your Kindle should look like this:

<img src="https://assets.mariannefeng.com/portfolio/kindle/kaul-app-homepage.jpeg" alt="An image of what KUAL looks like on launch with list of apps. One of the apps is called 'marianne hax'" class="less-than-half" />

<img src="https://assets.mariannefeng.com/portfolio/kindle/marianne-hax-app.jpeg" alt="An image of what it looks like once you click into 'marianne hax', only one menu item titled 'Start dashboard'" class="less-than-half" />

#### The dashboard start script explained

When you press 'Start dashboard', you can see in the menu.json that bin/start.sh will execute. The script is commented to generally explain what it does. Some interesting things I've never worked with before:

```
# ignore HUP since kual will exit after pressing start, and that might kill our long running script
trap '' HUP
...
# ignore term since stopping the framework/gui will send a TERM signal to our script since kual is probably related to the GUI
trap '' TERM
...
trap - TERM
```

traps! What the fuck is that. [link explaining traps here] This was necessary to get the script to work

getting rtcwake to work was annoying. For me calling rtcwake on the default device never worked, I had to list possible devices then choose a different one. The one that reacted woke up after the specified time was `rtc1` for me

```
do_night_suspend() {
  sync
  rtcwake -d rtc1 -m mem -s "$WAKE_IN_SECONDS"
}
```

The refresh_screen function is important. This is the whole reason we did all that server and image generation stuff earlier. It retrieves an image at the specified image endpoint, clears the screen twice, draws on the image we generated earlier from the server and positions it slightly lower on the screen to make room for the status bar up top. The last line displays a live datetime, wifi status, and battery remaining.

```
refresh_screen() {
  curl -k "$SCREEN_URL" -o "$DIR/screen.png"
  eips -c
  eips -c
  eips -g "$DIR/screen.png" -x 0 -y 30 -w gc16
  # Draw date/time and battery at top (eips can't print %, so we strip it from gasgauge-info -c)
  eips 1 1 "$(TZ=EST5EDT date '+%Y-%m-%d %I:%M %p') - wifi $(cat /sys/class/net/wlan0/operstate 2>/dev/null || echo '?') - battery: $(gasgauge-info -c 2>/dev/null | sed 's/%//g' || echo '?')"
}
```

This part is also important - when the script reaches the end, it listens for the user to press the menu button.

```
script -q -c "evtest /dev/input/event2 2>&1" /dev/null | grep -m 1 -q "code 102 (Home), value 1" && "$DIR/stop.sh"
```

`evtest` is the command used that listens for incoming events on a specified device on the kindle. In my case, any time I pressed the menu button, the evtest command would output code 102 (Home), value 1.

When the user presses the menu button, the stop.sh script is called automatically, which will kill the dashboard, clear the screen, and restart the kindle UI so that the device can be used normally.

<img src="https://assets.mariannefeng.com/portfolio/kindle/finished-product-closeup.jpeg" alt="A closeup of the Kindle screen, with a list of 3 upcoming busses, along with current date, wifi status, and battery amount displayed up top" class="three-quarters" />

Shout out to [koreader repo](https://github.com/koreader/koreader). I truly was stuck with this script until I poked around theirs to see how their script worked.

## Extra considerations

Now that I've got it running for about a month, what do I think? We use it every day we leave the house, and since it's in the living room, it's easy to see at a glance when the next bus is. I love it. Things I would do differently:

#### Color bleeding

Even though when I refresh the screen I clear it twice, the color bleed is still pretty noticeable after it's been running for a couple days. I have a theory that if I flash the screen completely black and then white again when the kindle goes to sleep at night it'd solve the problem but haven't tried it out yet.

#### Battery life

Right now it can go for around 5 days without being plugged in. I'd love for that number to be at the 2 week mark. Turning the device off for 10 hours does seem to have helped, but 2 weeks is still a long ways off. I've debated increasing the gap between screen refreshes, since it refreshes every minute right now, but I like (almost) live minute updates so would rather sacrifice that last if possible in the quest for longer battery life.

## Overall

This thing is bomb dot com, I swell with pride every time I look at it mounted on 3 rinky dink little screws. I'd love to see other people's Kindle hacks!
