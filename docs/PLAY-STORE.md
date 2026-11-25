# Publishing on Google Play

This guide explains, step by step, how to publish Number Merge Puzzle as an Android app on Google Play.

The game itself is a web client (`client/index.html`, `client/styles.css`, `client/js/`). To put it on Google Play, it is wrapped as an Android app with Capacitor. The server is not part of the Play Store app. The app works offline. The leaderboard and account features need the server, but the game itself does not.

## Step 1: Create a Google Play Developer Account

1. Go to the Google Play Console: https://play.google.com/console
2. Sign in with a Google account. Use the account you want to own the app.
3. Pay the one-time registration fee of **$25 USD**. This fee is paid once. There is no yearly fee.
4. Complete the identity verification. Google will ask for your name and details. Follow the on-screen steps.
5. Wait for Google to approve the account. This can take a few hours to a few days.

Keep the account safe. Use two-step verification on the Google account.

## Step 2: Build the Android App Bundle with Capacitor

Capacitor turns the web client into a native Android app. The client files become the app's web content.

### 2a. Install Capacitor

You need Node.js installed on your computer. In the project root, install the Capacitor command-line tool and the core package:

```bash
npm install @capacitor/core @capacitor/cli
```

### 2b. Initialise Capacitor

Run the init command in the project root. It asks for the app name and the app id. Use these values:

- **App name:** `Number Merge Puzzle`
- **App id:** use a reverse-domain id you own, for example `com.metaprintcreations.numbermergepuzzle` (change this to your own domain if you have one).

```bash
npx cap init "Number Merge Puzzle" com.metaprintcreations.numbermergepuzzle --web-dir=client
```

The `--web-dir=client` setting tells Capacitor that the web files live in the `client/` folder. This is the `webDir`. Capacitor copies the client files from there into the Android app.

### 2c. Add the Android platform

```bash
npx cap add android
```

This creates an `android/` folder with a native Android project.

### 2d. Copy the client files into the Capacitor webDir

Every time you change the client files, copy them again:

```bash
npx cap sync
```

This copies the files from `client/` into the Android project.

### 2e. Build the app

Open the project in Android Studio:

```bash
npx cap open android
```

In Android Studio, wait for the project to load and for Gradle to sync. Then build the Android App Bundle (AAB):

1. In the menu, go to **Build > Generate Signed App Bundle / APK**.
2. Choose **Android App Bundle (AAB)**. Google Play needs an AAB, not an APK, for new apps.
3. Choose your upload key (see Step 3 below) or create a new one.
4. Choose the `release` build type.
5. Click **Create**. Android Studio builds the AAB file.

The AAB file is the file you upload to the Play Console.

## Step 3: App Signing (Upload Key and Play App Signing)

Google Play signs the app that users download. You sign the AAB you upload with your upload key.

1. **Create an upload key.** In Android Studio, when you build the signed bundle, choose "Create new" keystore if you do not have one yet. Set a strong keystore password and a strong key password. Write both passwords down and keep them in a safe place.
2. **Keep the keystore file safe.** The keystore file (`.jks` or `.keystore`) is the key to your app. If you lose it, you cannot update the app. Back it up in a safe place. Never commit it to Git.
3. **Enrol in Play App Signing.** When you create the app in the Play Console (Step 5), Google asks you to enrol in Play App Signing. Accept it. Google then manages the final signing key. Your upload key is used only to prove that the AAB came from you.

## Step 4: Closed Testing Track (At Least 12 Testers for 14 Days)

Google requires new developer accounts to test the app in a closed track before production.

1. In the Play Console, go to **Testing > Closed testing**.
2. Create a closed testing track.
3. Upload your AAB to this track.
4. Add **at least 12 testers**. You need their email addresses. Add them to the testers list (or share a sign-up link, if your track allows it).
5. The testers install the app from the Play Store testing link and use it.
6. **The app must stay in closed testing for at least 14 days.** Do not rush this. Google counts the days.
7. Ask the testers to report bugs and crashes. Fix the bugs, build a new AAB, and upload it to the same track.

Only after the 14 days and the 12 testers can you apply for production access.

## Step 5: Create the App in the Play Console

1. In the Play Console, click **Create app**.
2. Enter the app name: `Number Merge Puzzle`.
3. Choose the default language.
4. Choose **App** (not Game — this is a puzzle app; choose the category that fits best in the store listing step).
5. Choose **Free**.
6. Accept the declarations and create the app.

## Step 6: Store Listing

Fill in the store listing. The ready-made text is in `store/listing.txt`.

- **Title:** `Number Merge Puzzle`
- **Short description:** under 80 characters. Use the short description from `store/listing.txt`.
- **Full description:** use the full description from `store/listing.txt`.
- **App icon:** 512 x 512 px PNG. The icon must show the game clearly and must not contain text that is too small to read.
- **Feature graphic:** 1024 x 500 px JPG or PNG. This is the banner at the top of the store page.
- **Screenshots:** at least 2 phone screenshots. Take 4 to 8 screenshots of the game on a phone: the board, a merge, the win screen, and the leaderboard if you show it. Screenshots must be real images of the app.
- **Category:** Puzzles (or Games > Puzzle).
- **Contact email:** add a support email address. This is the email users can contact you on.

## Step 7: Content Rating Questionnaire

1. In the Play Console, go to **Content rating**.
2. Fill in the questionnaire. Answer honestly about the content of the game.
3. The game has no violence, no gambling, no chat, and no user-generated content. Answer the questions with that in mind.
4. Submit the questionnaire. Google gives the app a rating (for example, Everyone).

## Step 8: Privacy Policy Link

Google Play requires a privacy policy for every app.

1. Publish the privacy policy text from `docs/PRIVACY-POLICY.md` on a public web page. You can host it on your own website, or on the same site as the game.
2. The support email in the policy is already set to muhammadsaadullahkhan001@gmail.com.
3. In the Play Console, go to **Privacy policy** and paste the public link to the policy page.
4. Also add the same link inside the app if you can (for example, on a settings or about screen).

## Step 9: Production Rollout

1. After the closed testing period (14 days, 12 testers) is complete, fix all serious bugs and crashes.
2. In the Play Console, go to **Production** and create a new release.
3. Upload the final release AAB (the same build you tested, or a new build with the fixes).
4. Add release notes. Write a short note in simple English about what is new (for the first release: "First release of Number Merge Puzzle.").
5. Review the release: check the listing, the content rating, the privacy policy link, and the app signing.
6. Click **Start rollout to Production**.
7. Google reviews the app. This can take a few hours to a few days. If Google finds a problem, it will tell you what to fix. Fix it and submit again.
8. When the review passes, the app goes live on Google Play. Anyone can find it and install it.

## After Launch

- Watch the Play Console for crashes and user reviews.
- Fix crashes quickly and upload a new release.
- Update the store listing when you add new features.
- Keep the privacy policy link working. If the policy changes, update the web page first, then the app.
