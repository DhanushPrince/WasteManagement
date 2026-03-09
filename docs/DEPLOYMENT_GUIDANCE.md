# Sutham-Next — Deployment guidance (ECS vs Amplify vs App Runner)

## What this app is

- **Framework:** Next.js 16 (App Router), React 19.
- **Server features:**
  - **API route** `POST /api/analyze-waste` — calls **AWS Bedrock** (Nova Pro) for image/waste analysis.
  - **API route** `POST /api/reverse-geocode` — calls **AWS Location Service** (Places) for reverse geocoding.
- **Runtime needs:** Node.js server (not a static export). Must run `next build` then `next start`.
- **Env / credentials:**
  - Bedrock: AWS credentials (IAM role in AWS, or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`); optional `AWS_DEFAULT_REGION` (default `us-east-1`).
  - Geocode: `AWS_LOCATION_API_KEY` (required); optional `AWS_LOCATION_REGION`.

---

## Comparison: ECS vs Amplify vs App Runner

| Criteria              | **Amplify**              | **App Runner**           | **ECS (Fargate)**        |
|-----------------------|--------------------------|--------------------------|---------------------------|
| **Setup effort**      | Lowest (Git → deploy)    | Medium (Docker + ECR)    | Highest (ALB, task def, etc.) |
| **Containers**        | No (Amplify runs Next)   | Yes                      | Yes                       |
| **Next.js support**   | Yes (SSR + API routes)   | Yes (via Docker)         | Yes (via Docker)          |
| **Bedrock / IAM**     | Yes (assign role to app) | Yes (task IAM role)      | Yes (task IAM role)       |
| **Env / secrets**     | Amplify env vars         | App Runner env / secrets | Task def env / Secrets    |
| **Scaling**           | Automatic                | Automatic                | You configure             |
| **Cost**              | Pay per build + hosting  | Pay per vCPU + request   | Pay per vCPU + storage    |
| **Best for**          | Frontend team, fast CI   | Simple container host   | Full control, multi-svc   |

---

## Recommendation

### Prefer **Amplify** if:
- You want the **fastest path**: connect repo → add env vars + IAM role → deploy.
- You’re fine with Amplify’s managed Next.js build and run (no Docker).
- You want preview branches and Git-based deploys.

### Prefer **App Runner** if:
- You **want a container** (e.g. same image for dev/stage/prod, or to reuse elsewhere).
- You already use **ECR + CI** to build images.
- You don’t need Amplify’s frontend-specific features.

### Prefer **ECS** if:
- You need **full control** (networking, multiple services, custom ALB/WAF).
- You’re already on ECS for other services and want one platform.

---

## 1. Deploy with **AWS Amplify** (recommended for “just get it live”)

1. **Repo:** Push `sutham-next` to GitHub/CodeCommit/Bitbucket.
2. **Amplify Console:** Create app → connect repo → choose branch.
3. **Build settings:** Use Amplify’s auto-detected Next.js (or set):
   - Build: `npm ci && npm run build`
   - Output: leave as default (Amplify handles Next.js).
4. **Service role:** Create/use an Amplify service role that can deploy (e.g. create Amplify app role).
5. **App role for Bedrock/Location:** In Amplify → App settings → Environment variables, you only set env vars. For **Bedrock**, you attach an IAM role to the **Amplify hosting** (Next.js server):
   - In **Amplify** (Gen 2): use “Access legacy Amplify Console” → Hosting → “Edit” for the app → attach a role that has `bedrock:InvokeModel` (and if you use Location from the same role, the right Location permissions).  
   - Or use **Amplify Gen 2** with a custom role: [Amplify Gen 2 – Next.js](https://docs.aws.amazon.com/amplify/latest/userguide/server-side-rendering.html).
6. **Env vars in Amplify:**
   - `AWS_LOCATION_API_KEY` = your Location API key.
   - `AWS_LOCATION_REGION` (optional).
   - `AWS_DEFAULT_REGION` (optional, for Bedrock).
   - Do **not** put AWS access/secret keys in env if you use an IAM role for Bedrock.
7. **Location API key:** If you’re using an API key (not IAM) for Location, keep that in env; Bedrock can use the app’s IAM role.

**Pros:** No Docker, no ECR; managed HTTPS and scaling.  
**Cons:** Tied to Amplify’s Next.js runtime; less control than containers.

---

## 2. Deploy with **App Runner**

1. **Dockerfile:** Add a production Dockerfile (see below).
2. **Build image:** e.g. `docker build -t sutham-next .` and push to **ECR**.
3. **App Runner:** Create service → source = ECR image.
4. **IAM:** Create a role for the App Runner **instance** with:
   - `bedrock:InvokeModel` (and any other Bedrock actions you use).
   - If you call Location with IAM, add Location permissions; otherwise use only env for the API key.
5. **Env in App Runner:** Add `AWS_LOCATION_API_KEY`, `AWS_LOCATION_REGION`, `AWS_DEFAULT_REGION` in the App Runner service config.

**Pros:** Simple container hosting; one Dockerfile can be reused.  
**Cons:** You maintain build/push (e.g. GitHub Actions or CodeBuild).

---

## 3. Deploy with **ECS (Fargate)**

1. Use the **same Dockerfile** as for App Runner.
2. **ECR:** Build and push image.
3. **ECS:** Create cluster → task definition (Fargate, your image, port 3000) → service.
4. **ALB:** Create Application Load Balancer; target group → ECS service.
5. **IAM:** Task role with Bedrock (+ Location if needed) permissions.
6. **Env:** Set in task definition (or use Secrets Manager for API key).

**Pros:** Full control, fits into existing ECS/VPC setup.  
**Cons:** More components (ALB, target groups, security groups, IAM).

---

## Dockerfile (for App Runner or ECS)

Create `sutham-next/Dockerfile`:

```dockerfile
# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system nodejs --gid 1001 && adduser --system nextjs --uid 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

For the standalone output, add to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

Then rebuild the image. Use this image in App Runner or ECS.

---

## Summary

- **Fastest and least ops:** **Amplify** — connect repo, set env vars, attach IAM role for Bedrock (and keep Location API key in env).
- **Container-based and simple:** **App Runner** — add Dockerfile + `output: "standalone"`, push to ECR, create service with IAM role and env.
- **Maximum control:** **ECS** — same image as App Runner, plus ALB and your own networking/IAM.

If you tell me which option you want (Amplify, App Runner, or ECS), I can add the exact `next.config` change and a ready-to-use Dockerfile in the repo.
