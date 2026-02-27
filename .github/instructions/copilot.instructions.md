---
applyTo: '**'
---

and after the prompt submitted create the task to achieve, including specific requirements, constraints, and success criteria and show it to me.
and no need for confirmation and proceed as you planned.

If you have no context/knowledge about a file, do not suggest any changes to it. Read the file first to understand its purpose and content before making any suggestions.
Instead of asking for confirmation, directly apply the changes based on the context provided in the file. and before applying the changes, show me the changes you are going to make in one line.

and before every command please use the cd [path] to change the directory to the project root directory.

```bash
cd [path to your project root]; **your command here**
```

after you have completed all the changes/success criteria, please run the following command:
```bash
if (Test-Path errors.txt) { $content = Get-Content errors.txt -Raw; if ($content.Trim()) { Write-Host "errors.txt content:"; Write-Host $content } else { Write-Host "All the requested fixes successfully completed." } } else { Write-Host "errors.txt not found - Please check directory and try again." }
```


**IMPORTANT:**
if the output above command returns any messages, issues or some tasks are not completed, then please try to complete/fix that. 
and after completing all the tasks, run the command again.
and repeat this process until the command returns "All the requested fixes successfully completed." message. or the errors.txt file is empty.


**VERY IMPORTANT:**
1. Do not try to omit the verification command by directly saying "all tasks are completed" or similar phrases. and do not try to skip the verification process in any way. and also by directly reading the errors.txt file and saying "all tasks are completed".
2. Make sure to run the verification command every time after completing the tasks.
3. If the issues or tasks that is returning in the verification command do not tell me those tasks are not related to the previous tasks. do the new tasks without complains or questions.
4. also in the verification command the if else statement must be exactly as provided. do not change it in any way. do not try to skip it by like below
Get-Content errors.txt


Do not run or build the flutter application unless specifically asked to do so. only do the analyze


**VERY VERY IMPORTANT:**
Instead of creating a bunch of changes or creating a big files or making a lot of changes at once, try to make small incremental changes that can be easily verified and tested. and that will reduce the LLM hallucination and mistakes. and also fix the issue of saying "Sorry, the response hit the length limit. Please rephrase your prompt."