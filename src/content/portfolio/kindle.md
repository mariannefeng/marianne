---
title: "repurpose your old Kindle"
description: "Hack an old kindle to display bus arrival times"
tags: [how-to, fun]
draft: true
githubUrl: "https://github.com/mariannefeng/kindle-hax"
pubDate: "Feb 20 2026"
---

# How to hack an old Kindle to display bus arrival times

[image of the end result]

This is how I turned an old Kindle (Kindle Touch 4th Generation/K5/KT) into a live bus feed that refreshes every minute with the option to exit out of dashboard mode by pressing the menu button. The high level steps are:

1. Jailbreak your kindle
2. Install KUAL & MRPI
3. Setup SSH
4. Run a server accessible over the internet (or your local network) that serves up a Kindle accepted image
5. Setup a way to continously retrieve the image on your Kindle

## 1. Jailbreaking your Kindle

This will be your [Kindle hacking bible](https://www.mobileread.com/forums/showthread.php?t=225030) for steps 1 - 3. The order of operations is to figure out what version of Kindle you have, what firmware it's running (shorthand FW in the Kindle forum guides + readmes), download the appropriate tar file and follow installation instructions.

Once you've successfully jailbroken your Kindle, it's time to install some things.

[an image that shows what a jailbroken Kindle looks like?]

## 2. Installing KUAL & MRPI

KUAL is a custom Kindle app launcher. MRPI was necessary so that I can install custom apps onto the Kindle (you may not need MRPI if you have a newer Kindle). This part was very difficult for me, reading through the mobile forum threads gave me a headache. The most helpful resource I found was the [Kindle modding wiki](https://kindlemodding.org/jailbreaking/post-jailbreak/installing-kual-mrpi/). Maybe other people aren't as oblivious as me but it took me way too long to realize that the "next step" in each individual guide can be accessed by clicking the "Next Step" button at the bottom of the page.

[screenshot of the next step button]

Another gotcha was that I _had_ to follow the [Setting up a Hotfix guide](https://kindlemodding.org/jailbreaking/post-jailbreak/setting-up-a-hotfix/) _before_ attempting to install KUAL & MRPI. Otherwise, the KUAL/MRPI install would fail.

[image of what it looks like if you install KUAL & MRPI successfully]

After successfully installing KUAL & MRPI, I also [Disabled OTA Updates](https://kindlemodding.org/jailbreaking/post-jailbreak/disable-ota.html) because why not. I stopped following the remaining steps after disabling OTA Updates because they didn't seem relevant to this project.

## 3. Setup SSH for your Kindle

This can be done with a KUAL extension called USBNetwork (which you can also download from the [Kindle hacking bible](https://www.mobileread.com/forums/showthread.php?t=225030)) that will allow you to SSH onto your Kindle as if it were a regular server.

However, nowhere in the forums could I find any information about how to actually install a KUAL extension using MRPI. Finally, this helpful [blogpost on setting up SSH for Kindle](https://blog.znjoa.com/2023/07/26/installing-usbnetwork-on-kindle/) came to my rescue. I followed the step that explained to how to install the extension, and how to setup SSH via USB. I ignored the rest of the instructions on the page because I'm not concerned about adding a password to the Kindle or setting up SSH over wifi.

If you've setup SSH successfully, you'll see two things:

[screenshot of green Ethernet gadget page]
[screenshot of successful SSH command]

Congratulations! Your Kindle is now ready to run custom code.

## 4. Running a server that generates an image for the Kindle

How displaying custom data on the Kindle works is that we need to create a png that fits the Kindle resolution, then draw the image onto the Kindle itself.

Since I live in New Jersey, I wanted to display NJTransit bus times on my Kindle. Luckily, NJTransit has a public GraphQL server that returns bus arrival times for any stop number.

#### Pulling NJ Transit bus data

By inspecting the network tab of the [NJ Transit Bus Website](https://www.njtransit.com/bus-to) I was able to figure out the appropriate GraphQL Payload that returns the bus number, arrival time, current capacity, destination, and departing time in minutes. The query looks like this:

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

#### Creating a server and generating the image

In the majority of the guides I read during this process (two most helpful being [Matt Healy's Kindle Dashboard guide](https://matthealy.com/kindle) and [Hemant's Kindle Dashboard guide](https://terminalbytes.com/reviving-kindle-paperwhite-7th-gen/)) they use puppeteer to convert HTML to png. This did not work for me because I'm cheap and have one $5 under-resourced Digital Ocean droplet that I use for all my side projects. And every time I ran puppeteer on it the server would crap out. So instead I created an endpoint that formats the bus data into nice looking HTML, then the docker container that runs the server would run a cron that runs the [wkhtmltoimage](https://wkhtmltopdf.org/) command and generate a Kindle formatted png every 3 minutes using the HTML endpoint. The server would then serve that generated image at a separate endpoint.

The entire server code - Dockerfile, scripts, the server itself - can be found in the [`server` folder of my Kindle hax repo](https://github.com/mariannefeng/kindle-hax/tree/main/server)

The server is written in Node because I originally wanted Puppeteer, SDFSDFJKSLDF could probably do it better + memory efficient in go

A couple things to call out about the image generation itself. The first is that the image will need to conform to your Kindle's screen resolution. You can find what yours is by running `KINDLE COMMAND HERE`. You'll see an output like this:

[screenshot of the resolution command]

My Kindle expected a 600x800 image. Another annoyance is that the image had to be rotated. Without passing a rotate command during the image generation process, I got skewed image like this:

[image of my first wonky Kindle try]

However, after rotating, the bus times could only be viewed horizontally. I wanted to be able to mount my Kindle vertically. So what that meant was I had to rotate the actual HTML itself. But when rotating an image and then taking a snapshot, the rotation is around the center of the screen so that snapshot made by wkhtmltoimage kept on cutting off the bus times. Finally, a combination of rotate and translate gave me what I needed, which was a rotated image that was aligned to the top left of the screen:

`transform: rotate(90deg) translateX(-100px) translateY(-100px);`

Once you have a server with an endpoint that serves your image (mine's at https://kindle.mariannefeng.com/screen), you're now ready to run this on the Kindle.

## 5. Creating a KUAL dashboard extension

I want two things - the first was an easy way to exit dashboard mode, the second was for the bus times to refresh every minute. All the guides I've seen so far ran a cron on their Kindle that hit their endpoint at specified intervals. However I didn't want to do this because I didn't want the Kindle after every restart to run the dashboard. I wanted to control when the dashboard is displayed. That means having a dashboard extension.

helpful links:

https://github.com/pascalw/kindle-dash
https://github.com/davidhampgonsalves/Life-Dashboard
https://www.instructables.com/Kindle-Weather-Station/
https://github.com/gadget1999/rpi-docker/tree/master/nook-weather
https://github.com/koreader/koreader

## Putting it all together
