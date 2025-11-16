import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        collision_message_detected = False

        def handle_console(msg):
            nonlocal collision_message_detected
            print(f"Browser Console: {msg.text}") # Print all console messages
            if "Collision detected" in msg.text:
                print(f"SUCCESS: Collision message found in console: '{msg.text}'")
                collision_message_detected = True

        page.on("console", handle_console)

        try:
            await page.goto("http://localhost:8000", wait_until="networkidle")
            print("Page loaded successfully.")

            # Click on the body to focus the window
            await page.click("body")
            print("Page focused.")

            # Press 'z' to move forward for 5 seconds
            print("Moving character forward to test for collision...")
            await page.keyboard.down("z")
            await asyncio.sleep(5)
            await page.keyboard.up("z")

            print("Taking screenshot...")
            await page.screenshot(path="verification/movement_and_collision_test.png")
            print("Screenshot saved to verification/movement_and_collision_test.png")

        except Exception as e:
            print(f"An error occurred during navigation or interaction: {e}")
            await browser.close()
            return

        await browser.close()

        if collision_message_detected:
            print("\nVerification successful: Movement is likely fluid and collision detection is working.")
        else:
            print("\nVerification FAILED: No collision message was detected in the console.")
            print("This could mean the character didn't hit the object, or the detection logic failed.")

if __name__ == "__main__":
    # Create verification directory if it doesn't exist
    import os
    if not os.path.exists("verification"):
        os.makedirs("verification")

    asyncio.run(main())
