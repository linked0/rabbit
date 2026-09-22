# Overview 
- 24th August
- Tasks for Agentic Settlement
- This tasks for rabbit and verex project. You can change files on the both projects.
- You don't need to create multiple branches for each task. I will let you merge in the middle of work if needed.
- These tasks is for following features.
    > the mandated trader. An agent that runs unattended in rabbit, forms its own view of a verex prediction market, trades on it, and settles — where the worst it can ever cost is a number the owner set in advance and the chain enforces, not a number the agent's own code promises.
- If you read DONE! mark, you can ignore it because it is done with analysis and discussion

# Tasks Definition and Discussion I
DONE!
It's all resolved and you don't need to look at this.

## Setting and Review Page
- The card for this page should be in Page
- The page should show like these items
    - Select the one market form the market list from verex
        - The page fetches the list from local verex server if it runs on rabbit local server.
        - It has a condition that a agent try to trade like once an period like one hour if some condition is fulfilled like a yes probility is 10% higher than one hour ago
    - The jUSD amount limit that the agent can use and comfirm button that can sign a signature for that through the Metamask
    - It shows the current status that the agent have used in trading in the current budget.
        - I can also show the current budget is all used up.
- This requirements should make the verex change.

