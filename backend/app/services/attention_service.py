from app.models.shopper_attention import ShopperAttention


class AttentionService:

    def save_attention(
        self,
        db,
        attention_data
    ):

        record = ShopperAttention(

            track_id=attention_data.track_id,

            shelf_name=attention_data.shelf_name,

            attention=attention_data.attention,

            yaw=attention_data.yaw,

            pitch=attention_data.pitch,

            roll=attention_data.roll,

            frame_number=attention_data.frame_number

        )

        db.add(record)

        db.commit()

        db.refresh(record)

        return record


attention_service = AttentionService()