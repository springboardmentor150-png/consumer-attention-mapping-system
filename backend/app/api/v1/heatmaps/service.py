import os
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.heatmap import HeatmapRecord
from app.models.shopper_session import ShopperSession
from app.models.attention_event import AttentionEvent
from app.models.dwell_time import DwellTimeRecord
from app.services.heatmap.generator import HeatmapGenerator
from app.services.heatmap.storage import HeatmapStorage
from app.schemas.heatmap import (
    HeatmapGenerateRequest,
    HeatmapResponse,
    HeatmapListResponse
)

class HeatmapService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = HeatmapStorage()

    async def generate_heatmap(self, request: HeatmapGenerateRequest) -> HeatmapResponse:
        gen = HeatmapGenerator(width=request.width, height=request.height)
        htype = request.heatmap_type.value if hasattr(request.heatmap_type, "value") else str(request.heatmap_type)

        now = datetime.now(timezone.utc)
        start_date = request.start_date or (now - timedelta(days=7))
        end_date = request.end_date or now

        # Convert to naive if needed for db comparison
        start_date_naive = start_date.replace(tzinfo=None) if start_date.tzinfo else start_date
        end_date_naive = end_date.replace(tzinfo=None) if end_date.tzinfo else end_date

        data_count = 0
        output_file_name = self.storage.generate_filename(str(request.store_id), htype, start_date)
        full_path = os.path.join(self.storage.base_path, output_file_name)

        if htype == "traffic":
            stmt = select(ShopperSession).where(
                ShopperSession.store_id == str(request.store_id)
            )
            res = await self.db.execute(stmt)
            sessions = res.scalars().all()

            coords = []
            for s in sessions:
                pdata = s.path_data or []
                if isinstance(pdata, str):
                    import json
                    try: pdata = json.loads(pdata)
                    except: pdata = []
                coords.extend(pdata)

            data_count = len(coords)
            gen.generate_traffic_heatmap(coords, full_path)

        elif htype == "attention":
            stmt = select(AttentionEvent)
            res = await self.db.execute(stmt)
            events = res.scalars().all()
            data_count = len(events)
            gen.generate_attention_heatmap(events, {}, full_path)

        else: # dwell or engagement
            stmt = select(DwellTimeRecord).where(
                DwellTimeRecord.store_id == str(request.store_id)
            )
            res = await self.db.execute(stmt)
            dwells = res.scalars().all()
            data_count = len(dwells)
            gen.generate_dwell_heatmap(dwells, full_path)

        # Create record in DB
        record = HeatmapRecord(
            store_id=str(request.store_id),
            camera_id=str(request.camera_id) if request.camera_id else None,
            heatmap_type=htype,
            file_path=full_path,
            file_name=output_file_name,
            resolution_width=request.width,
            resolution_height=request.height,
            data_points_count=data_count,
            period_start=start_date,
            period_end=end_date,
            is_current=True
        )
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)

        img_url = self.storage.get_image_url(output_file_name)
        
        return HeatmapResponse(
            id=UUID(record.id),
            store_id=UUID(record.store_id),
            camera_id=UUID(record.camera_id) if record.camera_id else None,
            heatmap_type=record.heatmap_type,
            file_path=record.file_path,
            file_name=record.file_name,
            resolution_width=record.resolution_width,
            resolution_height=record.resolution_height,
            data_points_count=record.data_points_count,
            period_start=record.period_start,
            period_end=record.period_end,
            is_current=record.is_current,
            generated_at=record.generated_at,
            image_url=img_url
        )

    async def get_store_heatmaps(self, store_id: UUID, heatmap_type: Optional[str] = None) -> HeatmapListResponse:
        stmt = select(HeatmapRecord).where(HeatmapRecord.store_id == str(store_id))
        if heatmap_type:
            stmt = stmt.where(HeatmapRecord.heatmap_type == heatmap_type)
        stmt = stmt.order_by(HeatmapRecord.generated_at.desc())

        res = await self.db.execute(stmt)
        records = res.scalars().all()

        responses = []
        for r in records:
            img_url = self.storage.get_image_url(r.file_name)
            responses.append(
                HeatmapResponse(
                    id=UUID(r.id),
                    store_id=UUID(r.store_id),
                    camera_id=UUID(r.camera_id) if r.camera_id else None,
                    heatmap_type=r.heatmap_type,
                    file_path=r.file_path,
                    file_name=r.file_name,
                    resolution_width=r.resolution_width,
                    resolution_height=r.resolution_height,
                    data_points_count=r.data_points_count,
                    period_start=r.period_start,
                    period_end=r.period_end,
                    is_current=r.is_current,
                    generated_at=r.generated_at,
                    image_url=img_url
                )
            )

        return HeatmapListResponse(store_id=store_id, heatmaps=responses)

    async def get_heatmap(self, heatmap_id: UUID) -> HeatmapResponse:
        stmt = select(HeatmapRecord).where(HeatmapRecord.id == str(heatmap_id))
        res = await self.db.execute(stmt)
        r = res.scalars().first()
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heatmap record not found")

        img_url = self.storage.get_image_url(r.file_name)
        return HeatmapResponse(
            id=UUID(r.id),
            store_id=UUID(r.store_id),
            camera_id=UUID(r.camera_id) if r.camera_id else None,
            heatmap_type=r.heatmap_type,
            file_path=r.file_path,
            file_name=r.file_name,
            resolution_width=r.resolution_width,
            resolution_height=r.resolution_height,
            data_points_count=r.data_points_count,
            period_start=r.period_start,
            period_end=r.period_end,
            is_current=r.is_current,
            generated_at=r.generated_at,
            image_url=img_url
        )

    async def get_image_path(self, heatmap_id: UUID) -> str:
        stmt = select(HeatmapRecord).where(HeatmapRecord.id == str(heatmap_id))
        res = await self.db.execute(stmt)
        r = res.scalars().first()
        if not r or not os.path.exists(r.file_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heatmap image file not found")
        return r.file_path

    async def delete_heatmap(self, heatmap_id: UUID):
        stmt = select(HeatmapRecord).where(HeatmapRecord.id == str(heatmap_id))
        res = await self.db.execute(stmt)
        r = res.scalars().first()
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heatmap record not found")

        if os.path.exists(r.file_path):
            try: os.remove(r.file_path)
            except: pass

        await self.db.delete(r)
        await self.db.commit()
